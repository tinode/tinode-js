/**
 * @file Utilities for uploading and downloading files.
 *
 * @copyright 2015-2023 Tinode LLC.
 */
'use strict';

import CommError from './comm-error.js';
import {
  isUrlRelative,
  jsonParseHelper
} from './utils.js';

let XHRProvider;

function addURLParam(relUrl, key, value) {
  const url = new URL(relUrl, window.location.origin);
  url.searchParams.append(key, value);
  return url.toString().substring(window.location.origin.length);
}

/**
 * @class LargeFileHelper - utilities for uploading and downloading files out of band.
 * Don't instantiate this class directly. Use {Tinode.getLargeFileHelper} instead.
 * @memberof Tinode
 *
 * @param {Tinode} tinode - the main Tinode object.
 * @param {string} version - protocol version, i.e. '0'.
 */
export default class LargeFileHelper {
  constructor(tinode, version) {
    this._tinode = tinode;
    this._version = version;

    this._apiKey = tinode._apiKey;
    this._authToken = tinode.getAuthToken();

    // Ongoing requests.
    this.xhr = [];
  }

  /**
   * Start uploading the file to an endpoint at baseUrl.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {string} baseUrl base URL of upload server.
   * @param {File|Blob} data data to upload.
   * @param {string} avatarFor topic name if the upload represents an avatar.
   * @param {Callback} onProgress callback. Takes one {float} parameter 0..1
   * @param {Callback} onSuccess callback. Called when the file is successfully uploaded.
   * @param {Callback} onFailure callback. Called in case of a failure.
   *
   * @returns {Promise} resolved/rejected when the upload is completed/failed.
   */
  uploadWithBaseUrl(baseUrl, data, avatarFor, onProgress, onSuccess, onFailure) {
    let url = `/v${this._version}/file/u/`;
    if (baseUrl) {
      let base = baseUrl;
      if (base.endsWith('/')) {
        // Removing trailing slash.
        base = base.slice(0, -1);
      }
      if (base.startsWith('http://') || base.startsWith('https://')) {
        url = base + url;
      } else {
        throw new Error(`Invalid base URL '${baseUrl}'`);
      }
    }

    const instance = this;
    const xhr = new XHRProvider();
    this.xhr.push(xhr);

    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    if (this._authToken) {
      xhr.setRequestHeader('X-Tinode-Auth', `Token ${this._authToken.token}`);
    }

    let toResolve = null;
    let toReject = null;

    const result = new Promise((resolve, reject) => {
      toResolve = resolve;
      toReject = reject;
    });

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        if (onProgress) {
          onProgress(e.loaded / e.total);
        }
        if (this.onProgress) {
          this.onProgress(e.loaded / e.total);
        }
      }
    };

    xhr.onload = function() {
      let pkt;
      try {
        pkt = JSON.parse(this.response, jsonParseHelper);
      } catch (err) {
        instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.response);
        pkt = {
          ctrl: {
            code: this.status,
            text: this.statusText
          }
        };
      }

      if (this.status >= 200 && this.status < 300) {
        if (toResolve) {
          toResolve(pkt.ctrl.params.url);
        }
        if (onSuccess) {
          onSuccess(pkt.ctrl);
        }
      } else if (this.status >= 400) {
        if (toReject) {
          toReject(new CommError(pkt.ctrl.text, pkt.ctrl.code));
        }
        if (onFailure) {
          onFailure(pkt.ctrl);
        }
      } else {
        instance._tinode.logger("ERROR: Unexpected server response status", this.status, this.response);
      }
    };

    xhr.onerror = function(e) {
      if (toReject) {
        toReject(e || new Error("failed"));
      }
      if (onFailure) {
        onFailure(null);
      }
    };

    xhr.onabort = function(e) {
      if (toReject) {
        toReject(new Error("upload cancelled by user"));
      }
      if (onFailure) {
        onFailure(null);
      }
    };

    try {
      const form = new FormData();
      form.append('file', data);
      form.set('id', this._tinode.getNextUniqueId());
      if (avatarFor) {
        form.set('topic', avatarFor);
      }
      xhr.send(form);
    } catch (err) {
      if (toReject) {
        toReject(err);
      }
      if (onFailure) {
        onFailure(null);
      }
    }

    return result;
  }
  /**
   * Start uploading the file to default endpoint.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {File|Blob} data to upload
   * @param {string} avatarFor topic name if the upload represents an avatar.
   * @param {Callback} onProgress callback. Takes one {float} parameter 0..1
   * @param {Callback} onSuccess callback. Called when the file is successfully uploaded.
   * @param {Callback} onFailure callback. Called in case of a failure.
   *
   * @returns {Promise} resolved/rejected when the upload is completed/failed.
   */
  upload(data, avatarFor, onProgress, onSuccess, onFailure) {
    const baseUrl = (this._tinode._secure ? 'https://' : 'http://') + this._tinode._host;
    return this.uploadWithBaseUrl(baseUrl, data, avatarFor, onProgress, onSuccess, onFailure);
  }
  /**
   * Download the file from a given URL using GET request. This method works with the Tinode server only.
   *
   * @memberof Tinode.LargeFileHelper#
   *
   * @param {string} relativeUrl - URL to download the file from. Must be relative url, i.e. must not contain the host.
   * @param {string=} filename - file name to use for the downloaded file.
   *
   * @returns {Promise} resolved/rejected when the download is completed/failed.
   */
  download(relativeUrl, filename, mimetype, onProgress, onError) {
    if (!isUrlRelative(relativeUrl)) {
      // As a security measure refuse to download from an absolute URL.
      if (onError) {
        onError(`The URL '${relativeUrl}' must be relative, not absolute`);
      }
      return;
    }
    if (!this._authToken) {
      if (onError) {
        onError("Must authenticate first");
      }
      return;
    }
    const instance = this;

    const xhr = new XHRProvider();
    this.xhr.push(xhr);

    // Add '&asatt=1' to URL to request 'Content-Disposition: attachment' response header.
    relativeUrl = addURLParam(relativeUrl, 'asatt', '1');

    // Get data as blob (stored by the browser as a temporary file).
    xhr.open('GET', relativeUrl, true);
    xhr.setRequestHeader('X-Tinode-APIKey', this._apiKey);
    xhr.setRequestHeader('X-Tinode-Auth', 'Token ' + this._authToken.token);
    xhr.responseType = 'blob';

    xhr.onprogress = function(e) {
      if (onProgress) {
        // Passing e.loaded instead of e.loaded/e.total because e.total
        // is always 0 with gzip compression enabled by the server.
        onProgress(e.loaded);
      }
    };

    let toResolve = null;
    let toReject = null;

    const result = new Promise((resolve, reject) => {
      toResolve = resolve;
      toReject = reject;
    });

    // The blob needs to be saved as file. There is no known way to
    // save the blob as file other than to fake a click on an <a href... download=...>.
    xhr.onload = function() {
      if (this.status == 200) {
        const link = document.createElement('a');
        // URL.createObjectURL is not available in non-browser environment. This call will fail.
        link.href = window.URL.createObjectURL(new Blob([this.response], {
          type: mimetype
        }));
        link.style.display = 'none';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        if (toResolve) {
          toResolve();
        }
      } else if (this.status >= 400 && toReject) {
        // The this.responseText is undefined, must use this.response which is a blob.
        // Need to convert this.response to JSON. The blob can only be accessed by the
        // FileReader.
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const pkt = JSON.parse(this.result, jsonParseHelper);
            toReject(new CommError(pkt.ctrl.text, pkt.ctrl.code));
          } catch (err) {
            instance._tinode.logger("ERROR: Invalid server response in LargeFileHelper", this.result);
            toReject(err);
          }
        };
        reader.readAsText(this.response);
      }
    };

    xhr.onerror = function(e) {
      if (toReject) {
        toReject(new Error("failed"));
      }
      if (onError) {
        onError(e);
      }
    };

    xhr.onabort = function() {
      if (toReject) {
        toReject(null);
      }
    };

    try {
      xhr.send();
    } catch (err) {
      if (toReject) {
        toReject(err);
      }
      if (onError) {
        onError(err);
      }
    }

    return result;
  }
  /**
   * Try to cancel all ongoing uploads or downloads.
   * @memberof Tinode.LargeFileHelper#
   */
  cancel() {
    this.xhr.forEach(req => {
      if (req.readyState < 4) {
        req.abort();
      }
    });
  }
  /**
   * To use LargeFileHelper in a non browser context, supply XMLHttpRequest provider.
   * @static
   * @memberof LargeFileHelper
   * @param xhrProvider XMLHttpRequest provider, e.g. for node <code>require('xhr')</code>.
   */
  static setNetworkProvider(xhrProvider) {
    XHRProvider = xhrProvider;
  }
}
