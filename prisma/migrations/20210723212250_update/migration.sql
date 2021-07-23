-- AlterTable
ALTER TABLE "User" ADD COLUMN     "voiceChannelId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("voiceChannelId") REFERENCES "VoiceChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
