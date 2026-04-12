export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: string | null
}

export interface UserProfile {
  id: string
  userId: string
  firstName: string | null
  lastName: string | null
  bio: string | null
  profilePicture: string | null
}

export interface UserSettings {
  id: string
  userId: string
  locale: string
  theme: string
  timezone: string
  aiDataSharing: boolean
}
