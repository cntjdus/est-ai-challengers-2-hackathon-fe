import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { enablePush, disablePush } from '../src/data/pushApi'
let registration, subscription, insert, client, bound
beforeEach(() => {
  bound = []
  subscription = { endpoint: 'https://fcm.googleapis.com/device', toJSON: () => ({ endpoint:'https://fcm.googleapis.com/device', keys:{ p256dh:'p',auth:'a' } }), unsubscribe:vi.fn().mockResolvedValue(true) }
  registration = {
    active:{ scriptURL:'https://app.test/hk-push-sw.js',postMessage:(message,ports) => {bound.push(message.userId);ports[0].postMessage({ok:true})} },
    pushManager:{ getSubscription:vi.fn().mockResolvedValue(null),subscribe:vi.fn().mockResolvedValue(subscription) },
    getNotifications:vi.fn().mockResolvedValue([]),
  }
  vi.stubGlobal('isSecureContext',true)
  vi.stubGlobal('PushManager',function(){})
  vi.stubGlobal('Notification',{permission:'granted',requestPermission:vi.fn().mockResolvedValue('granted')})
  vi.stubGlobal('MessageChannel',class {
    constructor(){this.port1={onmessage:null,close:()=>{}};this.port2={postMessage:data=>this.port1.onmessage({data})}}
  })
  vi.stubGlobal('navigator',{serviceWorker:{register:vi.fn().mockResolvedValue(registration),ready:Promise.resolve(registration),getRegistration:vi.fn().mockResolvedValue(registration)}})
  insert = vi.fn().mockResolvedValue({error:null})
  const q={eq:()=>q,then:resolve=>resolve({error:null})}
  client={from:()=>({insert,delete:()=>q})}
})
afterEach(()=>vi.unstubAllGlobals())
it('requests permission on activation and binds only after successful DB registration',async()=>{
  await enablePush(client,'u','A'.repeat(87))
  expect(Notification.requestPermission).toHaveBeenCalledOnce()
  expect(insert.mock.calls[0][0].user_id).toBe('u')
  expect(bound).toEqual([null,'u'])
})
it('does not subscribe on denied permission and rolls back a failed DB registration',async()=>{
  Notification.requestPermission.mockResolvedValueOnce('denied')
  await expect(enablePush(client,'u','A'.repeat(87))).rejects.toThrow('권한')
  expect(registration.pushManager.subscribe).not.toHaveBeenCalled()
  insert.mockResolvedValueOnce({error:new Error('offline')})
  await expect(enablePush(client,'u','A'.repeat(87))).rejects.toThrow('offline')
  expect(subscription.unsubscribe).toHaveBeenCalledOnce()
  expect(bound).toEqual([null])
})
it('unbinds, closes displayed notifications and unsubscribes before logout even if deletion fails',async()=>{
  const close=vi.fn(); registration.getNotifications.mockResolvedValue([{close}])
  registration.pushManager.getSubscription.mockResolvedValue(subscription)
  const q={eq:()=>q,then:resolve=>resolve({error:new Error('offline')})}
  await expect(disablePush({from:()=>({delete:()=>q})},'u')).rejects.toThrow('offline')
  expect(bound).toEqual([null]);expect(close).toHaveBeenCalledOnce();expect(subscription.unsubscribe).toHaveBeenCalledOnce()
})
