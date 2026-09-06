import NextAuth from 'next-auth';
import type { Session } from 'next-auth';
import { authConfig } from './auth.config';

const nextAuth = NextAuth(authConfig);

export const auth: () => Promise<Session | null> = nextAuth.auth;
export const handlers = nextAuth.handlers;
export const signIn: ReturnType<typeof NextAuth>["signIn"] = nextAuth.signIn;
export const signOut = nextAuth.signOut;
