# 스택과 큐

## 스택 (Stack)

**후입선출(LIFO: Last In First Out)** 구조입니다. 가장 나중에 들어간 요소가 가장 먼저 나옵니다.

```
Push 1, 2, 3:          Pop:
                       
    ┌───┐              ┌───┐
    │ 3 │ ← top        │ 3 │ → 먼저 나옴
    ├───┤              ├───┤
    │ 2 │              │ 2 │
    ├───┤              ├───┤
    │ 1 │              │ 1 │
    └───┘              └───┘
```

**주요 연산:**

| 연산 | 설명 | 시간복잡도 |
|------|------|-----------|
| push | 맨 위에 요소 추가 | O(1) |
| pop | 맨 위 요소 제거 및 반환 | O(1) |
| peek/top | 맨 위 요소 확인 (제거 안 함) | O(1) |
| isEmpty | 비어있는지 확인 | O(1) |

**배열 기반 구현:**

```c
typedef struct {
    int data[MAX_SIZE];
    int top;  // -1이면 비어있음
} Stack;

void push(Stack* s, int value) {
    if (s->top < MAX_SIZE - 1)
        s->data[++s->top] = value;
}

int pop(Stack* s) {
    if (s->top >= 0)
        return s->data[s->top--];
    return -1;  // 언더플로우
}
```

연결 리스트로 구현하면 크기 제한 없이 동적으로 사용할 수 있습니다.

---

## 큐 (Queue)

**선입선출(FIFO: First In First Out)** 구조입니다. 가장 먼저 들어간 요소가 가장 먼저 나옵니다.

```
Enqueue 1, 2, 3:              Dequeue:

front              rear       front              rear
  ↓                  ↓          ↓                  ↓
┌───┬───┬───┐              ┌───┬───┬───┐
│ 1 │ 2 │ 3 │              │ 1 │ 2 │ 3 │
└───┴───┴───┘              └───┴───┴───┘
                              ↑
                          먼저 나옴
```

**주요 연산:**

| 연산 | 설명 | 시간복잡도 |
|------|------|-----------|
| enqueue | 맨 뒤에 요소 추가 | O(1) |
| dequeue | 맨 앞 요소 제거 및 반환 | O(1) |
| front/peek | 맨 앞 요소 확인 (제거 안 함) | O(1) |
| isEmpty | 비어있는지 확인 | O(1) |

**원형 큐 (Circular Queue):**

배열을 원형으로 사용하여 공간 낭비를 해결합니다.

```c
typedef struct {
    int data[MAX_SIZE];
    int front, rear, count;
} CircularQueue;

void enqueue(CircularQueue* q, int value) {
    if (q->count == MAX_SIZE) return;
    q->rear = (q->rear + 1) % MAX_SIZE;
    q->data[q->rear] = value;
    q->count++;
}

int dequeue(CircularQueue* q) {
    if (q->count == 0) return -1;
    int value = q->data[q->front];
    q->front = (q->front + 1) % MAX_SIZE;
    q->count--;
    return value;
}
```

연결 리스트로 구현하면 front와 rear 포인터로 O(1) 삽입/삭제가 가능합니다.

---

## 스택 vs 큐 비교

| 구분 | 스택 | 큐 |
|------|------|-----|
| **순서** | LIFO (후입선출) | FIFO (선입선출) |
| **삽입 위치** | top (한쪽 끝) | rear (뒤) |
| **삭제 위치** | top (같은 끝) | front (앞) |
| **비유** | 접시 쌓기, 책 더미 | 줄 서기, 대기열 |
| **주요 연산** | push, pop | enqueue, dequeue |

---

## 스택 활용 사례

**1. 함수 호출 관리 (Call Stack)**

```
main() 호출
  └─ funcA() 호출
       └─ funcB() 호출
            └─ funcC() 호출

Call Stack:
┌─────────┐
│ funcC() │ ← 현재 실행
├─────────┤
│ funcB() │
├─────────┤
│ funcA() │
├─────────┤
│ main()  │
└─────────┘

funcC 종료 → pop → funcB로 복귀
```

재귀 호출도 스택으로 관리됩니다. 스택 오버플로우는 재귀가 너무 깊어질 때 발생합니다.

**2. 괄호 매칭**

```
여는 괄호: push
닫는 괄호: pop하여 짝 확인

"({[]})" → true (모든 짝 매칭)
"([)]"   → false (순서 불일치)

최종: 스택이 비어있어야 유효
```

**3. 후위 표기법 계산**

```
중위: 3 + 4 * 2
후위: 3 4 2 * +

계산 과정:
3 → push(3)           [3]
4 → push(4)           [3, 4]
2 → push(2)           [3, 4, 2]
* → pop 2, pop 4      [3], 4*2=8, push(8) → [3, 8]
+ → pop 8, pop 3      [], 3+8=11, push(11) → [11]
결과: 11
```

**4. 실행 취소 (Undo)**

```
작업 스택: [입력A, 입력B, 삭제C, 입력D]

Undo → pop(입력D) → 입력D 취소
Undo → pop(삭제C) → 삭제C 취소 (C 복원)
```

**5. DFS (깊이 우선 탐색)**

```
재귀 호출은 내부적으로 스택 사용
반복문 DFS는 명시적 스택 사용:

while (스택이 비어있지 않음):
    v = pop()
    방문 처리
    인접 정점들을 push
```

**6. 문자열 뒤집기**

```c
void reverse(char* str) {
    Stack stack;
    init(&stack);
    
    for (int i = 0; str[i]; i++) {
        push(&stack, str[i]);
    }
    
    for (int i = 0; str[i]; i++) {
        str[i] = pop(&stack);
    }
}
```

---

## 큐 활용 사례

**1. BFS (너비 우선 탐색)**

```
while (큐가 비어있지 않음):
    v = dequeue()
    방문 처리
    인접 정점들을 enqueue

최단 경로, 레벨별 탐색에 사용
```

**2. 프로세스 스케줄링**

```
Ready Queue:
┌────┬────┬────┬────┐
│ P1 │ P2 │ P3 │ P4 │
└────┴────┴────┴────┘
  ↑              ↑
front          rear

CPU가 P1 처리 → P1 완료 또는 타임아웃
→ P1 dequeue, 필요시 rear로 다시 enqueue
```

**3. 프린터 대기열**

```
인쇄 요청 순서대로 처리

Queue: [문서1, 문서2, 문서3]
         ↑
     먼저 인쇄
```

**4. 캐시 구현 (FIFO 캐시)**

```
캐시 크기: 3

요청: A, B, C, D, A

[A] → [A,B] → [A,B,C] → [B,C,D] → [C,D,A]
                         (A 제거)   (B 제거)
```

**5. 버퍼 (Buffer)**

```
Producer                    Consumer
    │                           │
    └──► [데이터1, 데이터2, ...] ◄──┘
              Buffer (Queue)

생산 속도 ≠ 소비 속도 → 큐로 완충
```

**6. 레벨 순서 트리 순회**

```
      1           Queue 사용으로 레벨별 순회
     / \          
    2   3         출력: 1 2 3 4 5
   / \
  4   5
```

---

## 특수한 큐

**덱 (Deque, Double-ended Queue):**

양쪽 끝에서 삽입/삭제가 가능합니다.

```
┌───┬───┬───┬───┐
│   │   │   │   │
└───┴───┴───┴───┘
  ↑           ↑
 앞 삽입/삭제  뒤 삽입/삭제
```

스택과 큐를 모두 구현할 수 있습니다.

**우선순위 큐 (Priority Queue):**

우선순위가 높은 요소가 먼저 나옵니다. 보통 **힙(Heap)**으로 구현합니다.

```
삽입: O(log n)
최고 우선순위 삭제: O(log n)

활용: 다익스트라 알고리즘, 작업 스케줄링, 이벤트 시뮬레이션
```

---

## 면접 예상 질문

**Q. 스택과 큐의 차이?**

스택은 LIFO(후입선출)로 나중에 들어간 요소가 먼저 나옵니다. 큐는 FIFO(선입선출)로 먼저 들어간 요소가 먼저 나옵니다. 스택은 함수 호출, 실행 취소에 사용되고, 큐는 BFS, 작업 대기열에 사용됩니다.

**Q. 스택 2개로 큐 구현?**

inbox와 outbox 두 스택을 사용합니다. enqueue는 inbox에 push합니다. dequeue는 outbox가 비어있으면 inbox의 모든 요소를 outbox로 옮긴 후(순서 반전) outbox에서 pop합니다. 분할 상환 O(1)입니다.

**Q. 큐 2개로 스택 구현?**

push 시 비어있지 않은 큐의 모든 요소를 다른 큐로 옮기고, 새 요소를 빈 큐에 넣은 후, 옮겼던 요소들을 다시 옮깁니다. pop은 요소가 있는 큐에서 dequeue합니다. push가 O(n)입니다.

**Q. 원형 큐란?**

배열 기반 큐에서 앞쪽 공간 낭비를 해결하기 위해 배열을 원형으로 사용합니다. `next = (current + 1) % size`로 인덱스를 순환시킵니다.

**Q. 스택 오버플로우란?**

스택 메모리 한계를 초과하는 경우입니다. 주로 재귀 호출이 너무 깊어질 때 발생합니다. 반복문으로 변환하거나 꼬리 재귀 최적화로 해결할 수 있습니다.

**Q. DFS는 스택, BFS는 큐를 사용하는 이유?**

DFS는 한 경로를 끝까지 탐색 후 되돌아오므로 최근 방문 노드부터 처리하는 LIFO가 적합합니다. BFS는 가까운 노드부터 탐색하므로 먼저 발견한 노드부터 처리하는 FIFO가 적합합니다.