import { getDriveClient } from "./google-auth";

export async function createFolder(name: string, parentId?: string) {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined
    },
    fields: "id,name"
  });
  return res.data;
}

export async function uploadTextFile(folderId: string, fileName: string, content: string, mimeType = "text/plain") {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: content },
    fields: "id,name,webViewLink"
  });
  return res.data;
}
