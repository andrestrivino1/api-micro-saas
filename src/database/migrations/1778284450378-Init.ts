import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778284450378 implements MigrationInterface {
    name = 'Init1778284450378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenants_kind_enum" AS ENUM('demo', 'paid')`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(200) NOT NULL, "kind" "public"."tenants_kind_enum" NOT NULL DEFAULT 'demo', "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('demo', 'owner')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "email" character varying(320) NOT NULL, "displayName" character varying(200) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'demo', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7346b08032078107fce81e014f6" UNIQUE ("tenantId", "email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c58f7e88c286e5e3478960a998" ON "users" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "pets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "clientId" uuid NOT NULL, "name" character varying(100) NOT NULL, "breed" character varying(100), "notes" character varying(500), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_ddeee2eea6e9192437a1bcf463" UNIQUE ("clientId"), CONSTRAINT "PK_d01e9e7b4ada753c826720bee8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_562cc0d9f1e138f7c055807f4d" ON "pets" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ddeee2eea6e9192437a1bcf463" ON "pets" ("clientId") `);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(200) NOT NULL, "phone" character varying(50) NOT NULL, "notes" character varying(500), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_78708145905b919ba16977437b" ON "clients" ("tenantId") `);
        await queryRunner.query(`CREATE TYPE "public"."appointments_reminderstatus_enum" AS ENUM('not_sent', 'sent')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "clientId" uuid NOT NULL, "petId" uuid NOT NULL, "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "service" character varying(100) NOT NULL, "reminderStatus" "public"."appointments_reminderstatus_enum" NOT NULL DEFAULT 'not_sent', "reminderSentAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_46e6a4182e96de9d4c1bba5060" ON "appointments" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c4dbd8eb292b83b5dc67be3cf4" ON "appointments" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_96e11d40768b1eea9dddc38a12" ON "appointments" ("petId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f32d2a32fa6890b002039b1786" ON "appointments" ("scheduledAt") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channel_enum" AS ENUM('whatsapp_simulated')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "appointmentId" uuid NOT NULL, "clientId" uuid NOT NULL, "channel" "public"."notifications_channel_enum" NOT NULL DEFAULT 'whatsapp_simulated', "messageText" text NOT NULL, "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5b86bc522af7cc9e3e13960ff" ON "notifications" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1a62bb5c29d64d2817bb9f789" ON "notifications" ("appointmentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b760535ce3bbf06a8dc446c908" ON "notifications" ("clientId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pets" ADD CONSTRAINT "FK_562cc0d9f1e138f7c055807f4db" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pets" ADD CONSTRAINT "FK_ddeee2eea6e9192437a1bcf4632" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_78708145905b919ba16977437b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_46e6a4182e96de9d4c1bba50604" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_c4dbd8eb292b83b5dc67be3cf45" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_96e11d40768b1eea9dddc38a124" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_a1a62bb5c29d64d2817bb9f7898" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_b760535ce3bbf06a8dc446c908f" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_b760535ce3bbf06a8dc446c908f"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_a1a62bb5c29d64d2817bb9f7898"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_96e11d40768b1eea9dddc38a124"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_c4dbd8eb292b83b5dc67be3cf45"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_46e6a4182e96de9d4c1bba50604"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_78708145905b919ba16977437b4"`);
        await queryRunner.query(`ALTER TABLE "pets" DROP CONSTRAINT "FK_ddeee2eea6e9192437a1bcf4632"`);
        await queryRunner.query(`ALTER TABLE "pets" DROP CONSTRAINT "FK_562cc0d9f1e138f7c055807f4db"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b760535ce3bbf06a8dc446c908"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a1a62bb5c29d64d2817bb9f789"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5b86bc522af7cc9e3e13960ff"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f32d2a32fa6890b002039b1786"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96e11d40768b1eea9dddc38a12"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4dbd8eb292b83b5dc67be3cf4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46e6a4182e96de9d4c1bba5060"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_reminderstatus_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78708145905b919ba16977437b"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ddeee2eea6e9192437a1bcf463"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_562cc0d9f1e138f7c055807f4d"`);
        await queryRunner.query(`DROP TABLE "pets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c58f7e88c286e5e3478960a998"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_kind_enum"`);
    }

}
