const required = [
  "JWT_SECRET",
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_CONTROL_SHEET_ID",
  "GOOGLE_DRIVE_ROOT_FOLDER_ID"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  appName: process.env.APP_NAME || "FPLS Inspection Platform",
  jwtSecret: process.env.JWT_SECRET!,
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
  googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  controlSheetId: process.env.GOOGLE_CONTROL_SHEET_ID!,
  driveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
};
