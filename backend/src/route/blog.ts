import { Hono } from "hono"
import { getPrisma } from "../usefulFun/prismaFunction";
import { verify } from "hono/jwt";
import { blogInput, blogUpdate } from "@sevenhealer/blogging-zod-validation";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string
    };
    Variables: {
        userId: string
    }
}>();

blogRouter.use("/*", async (c, next) => {
    const body = await c.req.json();
    try {
        const user = await verify(body.authentication, c.env.JWT_SECRET);
        const userId = String(user.id);
        c.set('userId', userId);
        console.log(userId)
        return next();
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
})

blogRouter.post('/', async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const body = await c.req.json();
    const { success } = blogInput.safeParse(body)
    if(!success){
        c.status(411);
        return c.json({
            message: "Input not correct"
        })
    }
    try {
        const blogId = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                userid: c.get("userId")
            }
        })
        return c.json({
            blogId: blogId.id
        })
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
})

blogRouter.put('/', async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const body = await c.req.json();
    const { success } = blogUpdate.safeParse(body)
    if(!success){
        c.status(411);
        return c.json({
            message: "Input not correct"
        })
    }
    try {
        const blogId = await prisma.post.update({
            where: {
                id: body.blogId
            },
            data: {
                title: body.title,
                content: body.content,
            }
        })
        return c.json({
            blogId: blogId.id
        })
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
})


blogRouter.get("/bulk" , async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    try{
        const blog = await prisma.post.findMany();
        return c.json(blog)
    }catch(e){
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
})

blogRouter.get('/:id',async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const id = c.req.param("id");
    try{
        const blogId = await prisma.post.findUnique({
            where: {
                id
            }
        })
        if(blogId){
        return c.json({
            title: blogId.title,
            content: blogId.content       
        })
    }
    }catch(e){
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
})
