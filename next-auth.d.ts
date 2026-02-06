import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            image: string;
            email?: string;
        };
        accessToken: string;
    }

    interface User {
        id: string;
        username: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        avatar: string;
        accessToken: string;
    }
}
