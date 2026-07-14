import { z } from 'zod'

import { ApiClientError, requestJson } from './client'
import { WEB_API_ENDPOINTS } from './endpoints'
import { buildLegacyLoginRequest } from './legacyWebCompatibility'
import { withTransientPrivateAuthToken } from './privateAuthLifecycle'

const AccountSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) =>
    [...value].every((character) => {
      const code = character.charCodeAt(0)
      return code > 31 && code !== 127
    })
  )
const PasswordSchema = z.string().min(1).max(256)
const IdentifierSchema = z.union([
  z.string().trim().min(1).max(128),
  z.number().int().nonnegative(),
])
const DisplayTextSchema = z.union([z.string().trim().max(160), z.number().finite()])
const OptionalDisplayTextSchema = DisplayTextSchema.nullish()

const LoginSuccessContentSchema = z.object({
  token: z.string().min(1).max(4096),
  uid: IdentifierSchema,
})

const LoginResponseSchema = z.object({
  content: z.union([LoginSuccessContentSchema, z.literal(false), z.null()]).optional(),
  resp: z.object({ msg: z.string().max(240).default('') }),
})

const UserDetailResponseSchema = z.object({
  content: z.object({
    uid: IdentifierSchema,
    mobile: OptionalDisplayTextSchema,
    elo: OptionalDisplayTextSchema,
    level_authstate: OptionalDisplayTextSchema,
    prolevel: OptionalDisplayTextSchema,
  }),
})

const UserCenterResponseSchema = z.object({
  content: z.object({
    nickname: z.string().trim().min(1).max(160),
    explain: z.string().trim().max(240).nullish(),
    mpurl: z.string().trim().max(2048).nullish(),
  }),
})

interface AuthenticatedAccount {
  readonly token: string
  readonly uid: string
  readonly nickname: string
  readonly mobile: string
}

function responseMismatch(): ApiClientError {
  return new ApiClientError({
    kind: 'contract-mismatch',
    message: '登录服务返回了无法识别的数据。',
    retryable: false,
  })
}

function invalidCredentialsMessage(message: string): string {
  if (message === '输入密码错误！') return '账号或密码错误。'
  if (message === '该账号不存在，请检查输入是否正确！') return '账号或密码错误。'
  return '登录失败，请检查账号和密码。'
}

async function login(accountInput: string, passwordInput: string): Promise<AuthenticatedAccount> {
  const account = AccountSchema.safeParse(accountInput)
  const password = PasswordSchema.safeParse(passwordInput)

  if (!account.success || !password.success) {
    throw new ApiClientError({
      kind: 'invalid-input',
      message: '请输入账号和密码。',
      retryable: false,
    })
  }

  const rawLogin = await requestJson({
    path: WEB_API_ENDPOINTS.passwordLogin,
    body: buildLegacyLoginRequest(account.data, password.data),
  })
  const loginResponse = LoginResponseSchema.safeParse(rawLogin)

  if (!loginResponse.success) throw responseMismatch()

  const loginContent = loginResponse.data.content
  if (!loginContent) {
    throw new ApiClientError({
      kind: 'auth-required',
      message: invalidCredentialsMessage(loginResponse.data.resp.msg),
      retryable: false,
    })
  }

  return withTransientPrivateAuthToken(loginContent.token, async () => {
    const [rawDetail, rawCenter] = await Promise.all([
      requestJson({
        path: WEB_API_ENDPOINTS.userDetail,
        auth: 'protected',
        body: { showall: 1, uid: loginContent.uid },
      }),
      requestJson({
        path: WEB_API_ENDPOINTS.userCenterInfo,
        auth: 'protected',
        body: {},
      }),
    ])
    const detail = UserDetailResponseSchema.safeParse(rawDetail)
    const center = UserCenterResponseSchema.safeParse(rawCenter)

    if (!detail.success || !center.success) throw responseMismatch()

    const detailUid = String(detail.data.content.uid)
    if (detailUid !== String(loginContent.uid)) throw responseMismatch()

    return {
      token: loginContent.token,
      uid: detailUid,
      nickname: center.data.content.nickname,
      mobile:
        detail.data.content.mobile === undefined || detail.data.content.mobile === null
          ? ''
          : String(detail.data.content.mobile),
    }
  })
}

export const authRepository = Object.freeze({ login })
