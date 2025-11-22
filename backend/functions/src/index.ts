/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { ShowController } from "./controllers/showController";
import cors from "cors";

setGlobalOptions({ maxInstances: 10 });

// Configure CORS to allow specific origins
const corsHandler = cors({
  origin: ["http://localhost:5173", "https://ai-show.com"],
  credentials: true,
});

export const getShow = onRequest(
  { timeoutSeconds: 300, memory: "1GiB" },
  (req, res) => {
    corsHandler(req, res, () => {
      ShowController.getShow(req, res);
    });
  }
);



