import sys

sys.path.append("/usr/local/lib/python3.9/site-packages")
sys.path.append('.')
import dropbox




access_token = 'q5LRDXfLpZIAAAAAAAAAATgpXulREK_9-r0JziSLDC2loJXZ436uzHuYnJ0_RaRc'
key = 'hvrbiv1pyu00ih0'
secret = 'wncwvelsz3yfvhu'
# Authenticate with Dropbox
print('Downloading images from Dropbox...')
dbx = dropbox.Dropbox(app_key = key, app_secret = secret, oauth2_refresh_token = access_token)

for entry in dbx.files_list_folder('').entries:
    print(entry)