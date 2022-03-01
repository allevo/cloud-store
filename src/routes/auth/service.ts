import { Static, Type } from '@sinclair/typebox'

export default class AuthService {
    constructor() {
    }

    // This method accepts an object with username and password and return (probably) a UserProfile
    // (depends on if the credentials are right or not)
    async findCredentials({ username, password }: FindCredentialArgumentType): Promise<UserProfile | null> {
        // We don't access to an external DB but just iterating over an hardcoded array
        const credential = db.find(u => u.username === username && u.password === password)
        if (!credential) {
            return null
        }
        // UserProfile has less field than CredentialStore
        // That means that you can easly convert the second one into first one
        // *BUT* this happens only at *compile time*, so at runtime the password is really returned
        // even if never used but this is not OK at all anyway...
        // So the following line, force to remove the password at runtime also and force to cast a compile time
        return { ...credential, password: undefined } as UserProfile
    }
}

export const FindCredentialArgument = Type.Object({
    username: Type.String(),
    password: Type.String(),
});
export type FindCredentialArgumentType = Static<typeof FindCredentialArgument>;

export type UserProfile = Omit<CredentialStore, "password">;

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
