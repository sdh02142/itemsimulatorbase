import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenInfo = authHeader.split(' ');
    if (tokenInfo.length != 2) {
      res.status(400).json({ error: '존재하지 않는 토큰' });
      return;
    }

    if (tokenInfo[0] != 'Bearer') {
      res.status(400).json({ error: '잘못된 토큰 타입' });
      return;
    }

    const token = tokenInfo[1];
    const decodeToken = jwt.verify(token, 'secretOrPrivateKey');
    const accountId = decodeToken.accountId;

    const accountInfo = await prisma.Accounts.findUnique({
      where: { accountId: accountId },
      select: { accountId: true, password: false, userName: true },
    });
    if (accountInfo == null) {
      res.status(400).json({ error: '잘못됐거나 만료된 계정 정보' });
      return;
    }

    req.accountInfo = accountInfo;

    next();
  } catch (error) {
    res.status(500).json({ error: '로그인 정보가 없음' });
  }
};

export default authMiddleware;
