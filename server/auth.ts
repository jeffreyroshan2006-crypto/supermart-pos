import { users, type User, type InsertUser } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStoreFactory from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Use safer imports for CommonJS modules in ESM
const PostgresStore = connectPg(session);
const MemoryStore = (MemoryStoreFactory as any)(session);

export function setupAuth(app: any) {
  const sessionStore = pool
    ? new PostgresStore({ pool, createTableIfMissing: true })
    : new MemoryStore({ checkPeriod: 86400000 }); // fallback

  const sessionSettings: session.SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "super-retail-billflow-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: app.get("env") === "production",
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        // Check if password has the expected format (salt:key)
        if (!user.password || !user.password.includes(':')) {
          console.error('Invalid password format for user:', username);
          return done(null, false, { message: "Invalid password format. Please contact administrator." });
        }

        const [salt, key] = user.password.split(":");

        if (!salt || !key) {
          console.error('Password missing salt or key for user:', username);
          return done(null, false, { message: "Invalid password format. Please contact administrator." });
        }

        const hashedBuffer = (await scryptAsync(password, salt, 64)) as Buffer;

        const keyBuffer = Buffer.from(key, "hex");
        const match = timingSafeEqual(hashedBuffer, keyBuffer);

        if (!match) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", (req: any, res: any, next: any) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        console.error("Login failed:", info.message);
        return res.status(401).json({ message: info.message ?? "Authentication failed" });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: any, res: any) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(200).json(null); // Return null instead of 401 for "me" check
    }
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}
