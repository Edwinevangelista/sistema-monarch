import { useState, useEffect, useCallback } from 'react'
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabaseClient'

// ⚠️ PRODUCTION KEYS — replace test_ values with production keys from RevenueCat Dashboard
// iOS key: Apps → [iOS app] → Public API key (starts with appl_)
// Android key: Apps → [Android app] → Public API key (starts with goog_)
const RC_API_KEY_IOS = process.env.REACT_APP_RC_API_KEY_IOS || 'appl_PENDING_ADD_IOS_APP_IN_REVENUECAT'
const RC_API_KEY_ANDROID = process.env.REACT_APP_RC_API_KEY_ANDROID || 'goog_JSiJykOmyhxCumPvMisgwdPqNMH'
const ENTITLEMENT_ID = 'FinGuide Pro'

// Determine key by platform
const getRCApiKey = () => {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return RC_API_KEY_IOS
  return RC_API_KEY_ANDROID
}

export function useRevenueCat(userId) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [offerings, setOfferings] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize RevenueCat (only on native platforms)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) {
      setLoading(false)
      return
    }

    async function configure() {
      try {
        // Only enable debug logs in development
        if (process.env.NODE_ENV !== 'production') {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
        }
        await Purchases.configure({ apiKey: getRCApiKey() })
        await Purchases.logIn({ appUserID: userId })
        setIsConfigured(true)

        // Check entitlement
        const { customerInfo } = await Purchases.getCustomerInfo()
        const active = customerInfo.entitlements.active[ENTITLEMENT_ID]
        setIsPremium(!!active)
      } catch (err) {
        console.error('RevenueCat init error:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    configure()
  }, [userId])

  // Load offerings (subscription packages)
  const loadOfferings = useCallback(async () => {
    if (!isConfigured) return null
    try {
      const { current } = await Purchases.getOfferings()
      setOfferings(current)
      return current
    } catch (err) {
      console.error('Error loading offerings:', err)
      return null
    }
  }, [isConfigured])

  // Purchase subscription
  const purchasePackage = useCallback(async (pkg) => {
    if (!isConfigured) throw new Error('RevenueCat not configured')
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID]
      if (active) {
        setIsPremium(true)
        // Sync to Supabase
        await supabase
          .from('perfiles')
          .update({
            plan: 'premium',
            plan_expires_at: active.expirationDate
          })
          .eq('id', userId)
        return true
      }
      return false
    } catch (err) {
      if (err.code === 'PURCHASE_CANCELLED') return false
      throw err
    }
  }, [isConfigured, userId])

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (!isConfigured) return false
    try {
      const { customerInfo } = await Purchases.restorePurchases()
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID]
      setIsPremium(!!active)
      if (active) {
        await supabase
          .from('perfiles')
          .update({
            plan: 'premium',
            plan_expires_at: active.expirationDate
          })
          .eq('id', userId)
      }
      return !!active
    } catch (err) {
      console.error('Restore error:', err)
      return false
    }
  }, [isConfigured, userId])

  return {
    isPremium,
    loading,
    error,
    offerings,
    isNative: Capacitor.isNativePlatform(),
    loadOfferings,
    purchasePackage,
    restorePurchases
  }
}
