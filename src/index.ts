import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { getPrisma } from './usefulFun/prismaFunction';

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

app.post('/api/v1/signup', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();
  
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
    return c.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/v1/signin', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return c.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordCorrect = await bcrypt.compare(body.password, user.password);

    if (isPasswordCorrect) {
      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
    } else {
      return c.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (e) {
    console.error(e);
    return c.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/v1/blog', (c) => {
  return c.text('Signup')
})

app.put('/api/v1/blog', (c) => {
  return c.text('Signup')
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('Signup')
})

export default app