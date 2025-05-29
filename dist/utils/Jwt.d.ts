interface TokenPayload {
    userId: string;
    role: string;
}
export declare const signToken: (payload: TokenPayload, expiresIn?: string) => string;
export declare const signRefreshToken: (payload: Pick<TokenPayload, "userId">) => string;
export declare const verifyToken: (token: string) => TokenPayload;
export {};
