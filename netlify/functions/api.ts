import { handle } from 'hono/netlify'
import { app } from '../../src/worker/index'

export const handler = handle(app)
