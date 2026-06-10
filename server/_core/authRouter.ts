import express from 'express';
// 클로드가 만들어준 파일에서 핵심 함수들을 가져옴
import { googleLoginHandler, logoutHandler } from './googleAuth'; 

export const authRouter = express.Router();

// 🚀 클로드의 핸들러가 req, res를 직접 다루도록 바로 연결!
authRouter.post('/google', googleLoginHandler);

// 🚀 로그아웃 주소도 마찬가지로 바로 연결
authRouter.post('/logout', logoutHandler);