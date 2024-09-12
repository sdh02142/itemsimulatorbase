import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();

// [심화] 라우터마다 prisma 클라이언트를 생성하고 있다. 더 좋은 방법이 있지 않을까?
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

// [필수] 1. 아이템 생성
// 1. 아이템 코드, 아이템 명, 아이템 능력, 아이템 가격을 req(request)에서 json으로 전달받기
// 2. 데이터베이스에 아이템 저장하기
router.post('/item/create/:itemId', async (req, res) => {
  // req.params.itemId: /item/create/(:itemId) <= url에 입력한 값
  try {
    const itemCode = Number(req.params.itemId);

    const itemName = req.body.item_name;
    const hp = req.body.hp;
    const atk = req.body.atk;
    const price = req.body.price;

    const createItem = await prisma.Items.create({
      data: {
        itemCode: itemCode,
        itemName: itemName,
        hp: hp,
        atk: atk,
        price: price,
      },
    });

    res.status(200).json({ item_info: createItem });
    console.log(createItem);
  } catch (error) {
    res
      .status(500)
      .json({ error: '아이템 중복 입력 혹은 잘못된 입력 감지, itemId에는 숫자만 입력가능' });
    console.log(error);
  }
});

// [필수] 2. 아이템 목록 조회
router.get('/item/list', async (req, res) => {
  const posts = await prisma.Items.findMany({
    select: {
      itemCode: true,
      itemName: true,
      hp: true,
      atk: true,
      price: true,
    },
    orderBy: {
      itemCode: 'asc',
    },
  });

  return res.status(200).json({ data: posts });
});

// [필수] 3. 특정 아이템 조회
// 아이템 코드는 URL의 parameter로 전달받기
router.get('/item/:itemCode', async (req, res) => {
  try {
    const itemCode = parseInt(req.params.itemCode);

    // 검색한 데이터 발견
    const findItem = await prisma.Items.findUnique({ where: { itemCode: +itemCode } });

    if (findItem == null) {
      res.status(404).json({ error: '존재하지 않는 아이템' });
      return;
    }

    // 클라이언트에게 발송
    res.status(200).json({ item_info: findItem });
  } catch (error) {
    res.status(500).json({ error: '아이템 조회 실패' });
    console.log(error);
  }
});

// [필수] 4. 특정 아이템 수정
// 아이템 코드는 URL의 parameter로 전달 받기
// 수정할 아이템 명, 아이템 능력을 req(request)에서 json으로 전달받기
router.post('/item/update/:itemCode', async (req, res) => {
  try {
    const itemCode = Number(req.params.itemCode);

    const { itemName, hp, atk } = req.body;

    const updateItem = await prisma.Items.update({
      where: { itemCode },
      data: {
        itemName,
        hp,
        atk,
      },
    });

    res.status(200).json({ update_info: updateItem });
    console.log(updateItem);
  } catch (error) {
    console.error('아이템 수정 실패:', error);

    if (error.code === 'P2025') {
      res.status(404).json({ error: '잘못된 itemCode 입력' });
    } else {
      res.status(500).json({ error: '아이템 수정 중 오류가 발생했습니다.' });
    }
    console.log(error);
  }
});

export default router;
