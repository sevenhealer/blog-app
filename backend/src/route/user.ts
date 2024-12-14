import { Hono } from "hono";
import { getPrisma } from "../usefulFun/prismaFunction";
import bcrypt from 'bcryptjs';
import { sign } from "hono/jwt";
import { signupInput, signinInput } from "@sevenhealer/blogging-zod-validation"

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    };
}>();

userRouter.post('/signup', async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const body = await c.req.json();
    const { success } = signupInput.safeParse(body)
    if(!success){
        c.status(411);
        return c.json({
            message: "Input not correct"
        })
    }
    try {
        const hashedPassword = await bcrypt.hash(body.password, 10);

        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: hashedPassword,
            },
        });

        const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.json({ jwt });
    } catch (e) {
        console.error(e);
        return c.json(
            {
                message: 'Internal Server Error',
            },
            500,
            {
                'X-Custom': 'Error',
            }
        )
    }
});

userRouter.post('/signin', async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body)
    if(!success){
        c.status(411);
        return c.json({
            message: "Input not correct"
        })
    }
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });

        if (!user) {
            return c.json(
                {
                    message: 'Invalid Email',
                },
                401,
                {
                    'X-Custom': 'Email Not Exist',
                }
            )
        }

        const isPasswordCorrect = await bcrypt.compare(body.password, user.password);

        if (isPasswordCorrect) {
            const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
            return c.json({ jwt });
        } else {
            return c.json(
                {
                    message: 'Invalid Password',
                },
                401,
                {
                    'X-Custom': 'Wrong Password',
                }
            )
        }
    } catch (e) {
        console.error(e);
        return c.json(
            {
                message: 'Internal Server Error',
            },
            500,
            {
                'X-Custom': 'Error',
            }
        )
    }
});