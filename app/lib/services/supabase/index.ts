import { createClient } from "@supabase/supabase-js";
// import { Database } from "./database.types";
// import * as jose from 'jose'
// import { type HonoRequest } from "hono";

export const useSupabase = (supabaseUrl: string, supabaseKey: string) => {
  const supabase = createClient(
    supabaseUrl,
    supabaseKey
  )

  return supabase;
}

// const issuer = 'lacomleague'
// const audience = 'lacomleague:audience'

// export const issueJWT = async (payload: any, jwt_secret: string) => {

//   const secret = new TextEncoder().encode(
//     jwt_secret
//   )
//   const alg = 'HS256'

//   const accessToken = await new jose.SignJWT(payload)
//     .setProtectedHeader({ alg })
//     .setIssuedAt()
//     .setIssuer(issuer)
//     .setAudience(audience)
//     .setExpirationTime('400d')
//     .sign(secret)

//   return accessToken

// }

// export type AccessTokenPayload = {
//   user_id: string
//   privy_id: string
//   wallet_address: string
// }

// export const getAccessTokenPayload = async (request: Request, jwt_secret: string): Promise<AccessTokenPayload | null> => {
//   const authHeader = request.cookies.get('Authorization');
//   const accessToken = authHeader?.split(' ')[1]
//   // console.log('accessToken', accessToken, authHeader)
//   if (!accessToken) return null

//   const secret = new TextEncoder().encode(
//     jwt_secret
//   )

//   try {

//     const { payload } = await jose.jwtVerify<AccessTokenPayload>(accessToken, secret, {
//       issuer: issuer,
//       audience: audience,
//     })

//     return payload;
//   } catch (error) {
//     console.log(error)
//     return null
//   }
// }