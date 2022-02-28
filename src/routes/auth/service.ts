import { Static, Type } from '@sinclair/typebox'


export const FindCredentialArgument = Type.Object({
    username: Type.String(),
    password: Type.String(),
});
export type FindCredentialArgumentType = Static<typeof FindCredentialArgument>;

export type UserProfile = Omit<CredentialStore, "password">;

export default class AuthService {
    constructor() {
    }

    async findCredentials({ username, password }: FindCredentialArgumentType): Promise<UserProfile | null> {
        const credential = db.find(u => u.username === username && u.password === password)
        if (!credential) {
            return null
        }
        return { ...credential, password: undefined } as UserProfile
    }
}

interface CredentialStore {
    id: number,
    username: string,
    password: string,
    name: string,
    surname: string,
    groups: string[],
}

const db: CredentialStore[] = [
    { id: 1, username: "allevo", password: 'pwd', name: "Tommaso", surname: "Allevi", groups: ["admin"] },
    { id: 2, username: "foobar", password: 'pwd', name: "Foo", surname: "Bar", groups: ["reader"] }
]
