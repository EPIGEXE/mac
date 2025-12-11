/**
 * Cloud Functions Entry Point
 * Study Mode API Functions
 */
import * as admin from 'firebase-admin'

// Firebase Admin 초기화
admin.initializeApp()

// 퀴즈 관련 함수들
export { generateQuiz } from './functions/generateQuiz'
export { evaluateAnswer, evaluateSentenceAnswers } from './functions/evaluateAnswer'
