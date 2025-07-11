import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {

    app.get('/', {
        preHandler: [checkSessionIdExists]
    }, async (request, reply) => {

        const { sessionId } = request.cookies;

        const transactions = await knex('transactions')
             .where('session_id', sessionId)
            .select();

        return {
            total: transactions.length,
            transactions: transactions,
            sessionId: sessionId
        }
    })

    app.get('/:id', {
        preHandler: [checkSessionIdExists]
    }, async (request, reply) => {
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getTransactionParamsSchema.parse(request.params);

        const { sessionId } = request.cookies;

        const transaction = await knex('transactions')
            .where({
                'id': id,
                'session_id': sessionId
            })
            .first();

        if (!transaction) {
            return reply.status(404).send({ message: 'Transaction not found' });
        }

        return {transaction: transaction};
    })

    app.get('/summary', {
        preHandler: [checkSessionIdExists]
    }, async (request) => {

        const { sessionId } = request.cookies;

        const summary = await knex('transactions')
            .where('session_id', sessionId)
            .sum('amount', { as: 'amount' })
            .first();

        return { summary:  summary}
    })

    app.post('/', async (request, reply) => {

        const createTransactionBodySchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit']),
        })

        const { title, amount, type } = createTransactionBodySchema.parse(request.body);

        let sessionId = request.cookies.sessionId;

        if (!sessionId) {
            sessionId = crypto.randomUUID();

            reply.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            })
        }

        await knex('transactions').insert({
            id: crypto.randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1,
            session_id: sessionId,
        })

        return reply.status(201).send()

    })


    app.delete('/all', async (request, reply) => {

        await knex('transactions').delete();

         return reply.status(200).send()

    })



}
