const discord = require('discord.js')

class WebhookHandler {
  constructor (webhooks) {
    if (!webhooks) throw new TypeError('Webhooks is undefined.')
    this.webhooks = []
    for (let hook of Object.keys(webhooks)) {
      this.webhooks.push(hook)
      let webhookCredentials = webhooks[hook].split('/').slice(-2)
      this[hook] = {
        url: webhooks[hook],
        id: webhookCredentials[0],
        token: webhookCredentials[1]
      }
      this[hook].client = new discord.WebhookClient(this[hook].id, this[hook].token)
    }
  }
  send (webhook, content) {
    if (this.webhooks && this.webhooks.includes(webhook)) {
      if (typeof content === 'object' && !(content instanceof Array)) {
        content = {
          embeds: [ content ]
        }
      }
      if (content) {
        this[webhook].client.send(content).catch((err) => { console.log(err) })
      }
    }
  }
}
module.exports = WebhookHandler
