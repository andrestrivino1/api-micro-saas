import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWhatsappCloudChannel1778516466619 implements MigrationInterface {
    name = 'AddWhatsappCloudChannel1778516466619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "externalMessageId" character varying(200)`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_channel_enum" RENAME TO "notifications_channel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channel_enum" AS ENUM('whatsapp_simulated', 'whatsapp_link', 'whatsapp_cloud')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "channel" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "channel" TYPE "public"."notifications_channel_enum" USING "channel"::"text"::"public"."notifications_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "channel" SET DEFAULT 'whatsapp_simulated'`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_channel_enum_old" AS ENUM('whatsapp_simulated', 'whatsapp_link')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "channel" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "channel" TYPE "public"."notifications_channel_enum_old" USING "channel"::"text"::"public"."notifications_channel_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "channel" SET DEFAULT 'whatsapp_simulated'`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_channel_enum_old" RENAME TO "notifications_channel_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "externalMessageId"`);
    }

}
