import { it, expect, test, beforeAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'
import { after } from 'node:test'
import { a } from 'vitest/dist/chunks/suite.d.FvehnV49'

describe('Transactions routes', () => {
    beforeAll(async () => {
        await app.ready()
    })

    after(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    test('user can create a new transaction', async () => {

        await request(app.server).post('/transactions').send({
            title: "New Transaction",
            amount: 5000,
            type: "credit",
        }).expect(201)

        const responseStatusCode = 201;

        expect(responseStatusCode).toEqual(201);

    })

    it('should be able to list all transactions', async () => {

        const createTransactionResponse = await request(app.server).post('/transactions').send({
            title: "New Transaction",
            amount: 5000,
            type: "credit",
        })

        const cookies = createTransactionResponse.get('Set-Cookie');


        console.log('Cookies:', cookies);

        const listTransactionResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', String(cookies))
            .expect(200)

   

        expect(listTransactionResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: "New Transaction",
                amount: 5000,
            })
        ])
    })

    it('should be able to get a specific transaction', async () => {

        const createTransactionResponse = await request(app.server).post('/transactions').send({
            title: "New Transaction",
            amount: 5000,
            type: "credit",
        })

        const cookies = createTransactionResponse.get('Set-Cookie');

        const listTransactionResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', String(cookies))
            .expect(200)

        const transactionId = listTransactionResponse.body.transactions[0].id;

           const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', String(cookies))
            .expect(200)

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: "New Transaction",
                amount: 5000,
            })
        )
    })

    it('should be able to get the summary', async () => {

        const createTransactionResponse = await request(app.server).post('/transactions').send({
            title: "New Transaction",
            amount: 5000,
            type: "credit",
        })

        const cookies = createTransactionResponse.get('Set-Cookie');

        await request(app.server)
        .post('/transactions')
        .set('Cookie', String(cookies))
        .send({
            title: "Debit Transaction",
            amount: 2000,
            type: "debit",
        })

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', String(cookies))
            .expect(200)

    
        expect(summaryResponse.body.summary).toEqual({
            amount: 3000
        })
    })
})

