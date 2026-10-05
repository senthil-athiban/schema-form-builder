import { Router } from "express";
import { AppError } from "../errors/app-error";
import { createHmac, timingSafeEqual } from "crypto";
import { asyncHandler } from "../middleware/async-handler";
import { deactivateByConnectionId, upsertFromNangoAuth } from "../services/integration.service";

const nangoWebhookRouter = Router();

type NangoAuthWebhook = {
    type?: string;
    operation?: string;
    success?: boolean;
    connectionId?: string;
    providerConfigKey?: string;
    tags?: { organization_id: string }
}

nangoWebhookRouter.post("/webhook", asyncHandler(async (req, res) => {
    const rawBody = getRawBody(req);
    const signature = req.header("x-nango-hmac-sha256");

    if (!verifySignature(rawBody, signature)) {
        throw new AppError("Invalid nango signature", 401);
    }

    const payload = req.body as NangoAuthWebhook;

    if (payload.type !== "auth" || !payload.connectionId) {
        res.status(200).json({ ok: true, ignored: true });
        return;
    }

    if (payload.operation === "creation" && payload.success) {
        const workspaceId = payload.tags?.organization_id;
        if (!workspaceId || !payload.providerConfigKey) {
            res.status(200).json({ ok: true, ignored: true });
            return;
        }

        await upsertFromNangoAuth({
            workspaceId,
            connectionId: payload.connectionId,
            providerConfigKey: payload.providerConfigKey
        })
    }

    if (payload.operation === "refresh" && payload.success === false) {
        await deactivateByConnectionId(payload.connectionId);
      }
      res.status(200).json({ ok: true });
}))

// ------------------ HELPERS ------------------------------------------
const getRawBody = (req: Express.Request) : Buffer => {
    const raw = (req as Express.Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      throw new AppError("Missing raw body", 400);
    }
    return raw;
}

const verifySignature = (rawBody: Buffer, header: string | undefined) => {
    const secret = process.env.NANGO_WEBHOOK_SECRET;
    if (!secret) throw new AppError("NANGO_WEBHOOK_SECRET is not set", 500);
    if (!header) return false;

    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(header);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

export default nangoWebhookRouter;