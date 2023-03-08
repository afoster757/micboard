from __future__ import absolute_import, division, print_function, unicode_literals
import sys
from threading import local
import tornado_server
import config2
sys.path.append("/usr/local/lib/python3.9/site-packages")
sys.path.append('.')
import dropbox
import time
import config2
import json
from pathlib import Path


import hashlib
import six

#config2.config()

class DropboxContentHasher(object):
    """
    Computes a hash using the same algorithm that the Dropbox API uses for the
    the "content_hash" metadata field.
    The digest() method returns a raw binary representation of the hash.  The
    hexdigest() convenience method returns a hexadecimal-encoded version, which
    is what the "content_hash" metadata field uses.
    This class has the same interface as the hashers in the standard 'hashlib'
    package.
    Example:
        hasher = DropboxContentHasher()
        with open('some-file', 'rb') as f:
            while True:
                chunk = f.read(1024)  # or whatever chunk size you want
                if len(chunk) == 0:
                    break
                hasher.update(chunk)
        print(hasher.hexdigest())
    """

    BLOCK_SIZE = 4 * 1024 * 1024

    def __init__(self):
        self._overall_hasher = hashlib.sha256()
        self._block_hasher = hashlib.sha256()
        self._block_pos = 0

        self.digest_size = self._overall_hasher.digest_size
        # hashlib classes also define 'block_size', but I don't know how people use that value

    def update(self, new_data):
        if self._overall_hasher is None:
            raise AssertionError(
                "can't use this object anymore; you already called digest()")

        assert isinstance(new_data, six.binary_type), (
            "Expecting a byte string, got {!r}".format(new_data))

        new_data_pos = 0
        while new_data_pos < len(new_data):
            if self._block_pos == self.BLOCK_SIZE:
                self._overall_hasher.update(self._block_hasher.digest())
                self._block_hasher = hashlib.sha256()
                self._block_pos = 0

            space_in_block = self.BLOCK_SIZE - self._block_pos
            part = new_data[new_data_pos:(new_data_pos+space_in_block)]
            self._block_hasher.update(part)

            self._block_pos += len(part)
            new_data_pos += len(part)

    def _finish(self):
        if self._overall_hasher is None:
            raise AssertionError(
                "can't use this object anymore; you already called digest() or hexdigest()")

        if self._block_pos > 0:
            self._overall_hasher.update(self._block_hasher.digest())
            self._block_hasher = None
        h = self._overall_hasher
        self._overall_hasher = None  # Make sure we can't use this object anymore.
        return h

    def digest(self):
        return self._finish().digest()

    def hexdigest(self):
        return self._finish().hexdigest()

    def copy(self):
        c = DropboxContentHasher.__new__(DropboxContentHasher)
        c._overall_hasher = self._overall_hasher.copy()
        c._block_hasher = self._block_hasher.copy()
        c._block_pos = self._block_pos
        return c


class StreamHasher(object):
    """
    A wrapper around a file-like object (either for reading or writing)
    that hashes everything that passes through it.  Can be used with
    DropboxContentHasher or any 'hashlib' hasher.
    Example:
        hasher = DropboxContentHasher()
        with open('some-file', 'rb') as f:
            wrapped_f = StreamHasher(f, hasher)
            response = some_api_client.upload(wrapped_f)
        locally_computed = hasher.hexdigest()
        assert response.content_hash == locally_computed
    """

    def __init__(self, f, hasher):
        self._f = f
        self._hasher = hasher

    def close(self):
        return self._f.close()

    def flush(self):
        return self._f.flush()

    def fileno(self):
        return self._f.fileno()

    def tell(self):
        return self._f.tell()

    def read(self, *args):
        b = self._f.read(*args)
        self._hasher.update(b)
        return b

    def write(self, b):
        self._hasher.update(b)
        return self._f.write(b)

    def next(self):
        b = self._f.next()
        self._hasher.update(b)
        return b

    def readline(self, *args):
        b = self._f.readline(*args)
        self._hasher.update(b)
        return b

    def readlines(self, *args):
        bs = self._f.readlines(*args)
        for b in bs:
            self._hasher.update(b)
        return b


def filehash(fn):
    hasher = DropboxContentHasher()
    with open(fn, 'rb') as f:
        while True:
            chunk = f.read(1024)  # or whatever chunk size you want
            if len(chunk) == 0:
                break
            hasher.update(chunk)
    return hasher.hexdigest()

def getFiles():
    # read access token
    access_token = 'q5LRDXfLpZIAAAAAAAAAATgpXulREK_9-r0JziSLDC2loJXZ436uzHuYnJ0_RaRc'
    key = 'hvrbiv1pyu00ih0'
    secret = 'wncwvelsz3yfvhu'
    localdirectory = config2.gif_dir
    # Authenticate with Dropbox
    print('Downloading images from Dropbox...')
    print('Local backgrounds fold is' + localdirectory)
    dbx = dropbox.Dropbox(app_key = key, app_secret = secret, oauth2_refresh_token = access_token)
    localdirectory = config2.gif_dir
    for entry in dbx.files_list_folder('').entries:
        localfile = Path(localdirectory + '/' + entry.name)
        if localfile.is_file():
            localfilehash = filehash(localfile)
            if localfilehash == entry.content_hash:
                print(entry.name + ' already exists. No update needed')
            else:
                print(entry.name + ' has been updated. Downloading update.')
                newPath = localdirectory + '/' + entry.name
                currentPath = '/' + entry.name
                dbx.files_download_to_file(newPath,currentPath)
        else:
            print(entry.name + ' does not exist. Downloading file')
            newPath = localdirectory + '/' + entry.name
            currentPath = '/' + entry.name
            dbx.files_download_to_file(newPath,currentPath)
    
    jpgs = tornado_server.file_list('.jpg')
    print(jpgs)

    with open('data.json', 'r+') as f:
        json_data = json.load(f)
        json_data['jpg'] = jpgs
        f.seek(0)
        f.write(json.dumps(json_data))
        f.truncate()

    time.sleep(300)
    getFiles()