# Nest.js

## Nest.js란?

**Node.js 기반의 서버 사이드 애플리케이션 프레임워크**입니다. TypeScript를 기본으로 사용하며, Angular에서 영감을 받은 구조화된 아키텍처를 제공합니다.

Express(또는 Fastify)를 내부적으로 사용하면서, 그 위에 **모듈화**, **의존성 주입**, **데코레이터 기반 프로그래밍** 등 엔터프라이즈급 기능을 추가합니다.

### 왜 Nest.js를 사용하는가?

| 이유 | 설명 |
|------|------|
| **구조화된 아키텍처** | 모듈, 컨트롤러, 서비스로 명확한 관심사 분리 |
| **TypeScript 기본** | 타입 안전성, IDE 지원, 리팩토링 용이 |
| **의존성 주입** | 테스트 용이, 느슨한 결합 |
| **데코레이터 패턴** | 선언적이고 읽기 쉬운 코드 |
| **풍부한 생태계** | 인증, DB, GraphQL, 마이크로서비스 등 공식 모듈 |
| **Express 호환** | 기존 Express 미들웨어 그대로 사용 가능 |

### Express vs Nest.js

| 구분 | Express | Nest.js |
|------|---------|---------|
| 구조 | 자유로움 (비구조적) | 강제된 아키텍처 |
| 언어 | JavaScript (TS 수동 설정) | TypeScript 기본 |
| 의존성 주입 | 없음 | 내장 |
| 학습 곡선 | 낮음 | 상대적으로 높음 |
| 적합한 규모 | 소규모, 빠른 개발 | 중대규모, 팀 프로젝트 |
| 테스트 | 직접 구성 | 테스트 모듈 내장 |

Express는 자유롭지만 프로젝트가 커지면 구조가 혼란스러워집니다. Nest.js는 초기 학습 비용이 있지만, 일관된 구조로 대규모 프로젝트에서 유지보수가 쉽습니다.

---

## 핵심 개념

Nest.js의 아키텍처는 **Module**, **Controller**, **Provider(Service)**로 구성됩니다.

```
┌─────────────────────────────────────┐
│              Module                 │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Controller  │→ │   Service    │  │
│  │ (라우팅)     │  │  (비즈니스)   │  │
│  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

### Module

**관련 기능을 그룹화하는 단위**입니다. 모든 Nest 애플리케이션은 최소 하나의 루트 모듈을 가집니다. 모듈은 컨트롤러, 서비스, 다른 모듈을 조합합니다.

```typescript
@Module({
  imports: [DatabaseModule, AuthModule],  // 다른 모듈
  controllers: [UserController],           // 이 모듈의 컨트롤러
  providers: [UserService],                // 이 모듈의 서비스
  exports: [UserService],                  // 다른 모듈에 공개
})
export class UserModule {}
```

| 속성 | 설명 |
|------|------|
| `imports` | 이 모듈에서 사용할 다른 모듈 |
| `controllers` | 이 모듈의 컨트롤러 |
| `providers` | 이 모듈의 서비스 (DI 컨테이너에 등록) |
| `exports` | 다른 모듈에서 사용할 수 있게 공개 |

### Controller

**HTTP 요청을 처리하고 응답을 반환**합니다. 라우팅을 담당하며, 비즈니스 로직은 서비스에 위임합니다.

```typescript
@Controller('users')  // /users 경로
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Get()              // GET /users
  findAll() {
    return this.userService.findAll();
  }
  
  @Get(':id')         // GET /users/:id
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
  
  @Post()             // POST /users
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### Provider (Service)

**비즈니스 로직을 담당**합니다. 데이터베이스 접근, 외부 API 호출 등 실제 작업을 수행합니다. `@Injectable()` 데코레이터로 DI 컨테이너에 등록됩니다.

```typescript
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  
  findAll() {
    return this.userRepository.find();
  }
  
  findOne(id: string) {
    return this.userRepository.findOne(id);
  }
  
  create(dto: CreateUserDto) {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }
}
```

---

## 의존성 주입 (Dependency Injection)

### DI란?

**객체가 필요한 의존성을 직접 생성하지 않고 외부에서 주입받는 패턴**입니다. Nest.js는 IoC(Inversion of Control) 컨테이너를 내장하여 DI를 자동으로 처리합니다.

```typescript
// ❌ 직접 생성 (강한 결합)
class UserController {
  private userService = new UserService();
}

// ✅ 주입받음 (느슨한 결합)
class UserController {
  constructor(private readonly userService: UserService) {}
}
```

### DI의 장점

| 장점 | 설명 |
|------|------|
| **느슨한 결합** | 구현체 교체 용이 |
| **테스트 용이** | Mock 주입 가능 |
| **재사용성** | 서비스를 여러 곳에서 공유 |
| **생명주기 관리** | 싱글톤, 요청 범위 등 자동 관리 |

### Provider 범위 (Scope)

| 범위 | 설명 |
|------|------|
| `DEFAULT` (싱글톤) | 애플리케이션 전체에서 하나의 인스턴스 |
| `REQUEST` | 요청마다 새 인스턴스 |
| `TRANSIENT` | 주입될 때마다 새 인스턴스 |

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {}
```

대부분 기본값인 싱글톤을 사용합니다. 요청별 데이터(사용자 정보 등)가 필요할 때만 REQUEST 범위를 사용합니다.

---

## 데코레이터

Nest.js는 **데코레이터를 광범위하게 사용**합니다. 클래스, 메서드, 파라미터에 메타데이터를 추가하여 동작을 정의합니다.

### 주요 데코레이터

| 종류 | 데코레이터 | 설명 |
|------|-----------|------|
| 클래스 | `@Module()` | 모듈 정의 |
| | `@Controller()` | 컨트롤러 정의, 경로 지정 |
| | `@Injectable()` | DI 가능한 프로바이더 |
| HTTP 메서드 | `@Get()`, `@Post()` | HTTP 메서드 매핑 |
| | `@Put()`, `@Delete()` | |
| | `@Patch()` | |
| 파라미터 | `@Param()` | URL 파라미터 |
| | `@Query()` | 쿼리 스트링 |
| | `@Body()` | 요청 본문 |
| | `@Headers()` | 요청 헤더 |
| 기타 | `@UseGuards()` | 가드 적용 |
| | `@UsePipes()` | 파이프 적용 |
| | `@UseInterceptors()` | 인터셉터 적용 |

### 커스텀 데코레이터

`createParamDecorator()`로 파라미터 데코레이터를 만들 수 있습니다. 예를 들어 `@CurrentUser()` 데코레이터로 요청에서 사용자 정보를 추출할 수 있습니다.

---

## 요청 라이프사이클

HTTP 요청이 들어오면 다음 순서로 처리됩니다.

```
요청 → Middleware → Guard → Interceptor(전) → Pipe → Controller → Service
      → Interceptor(후) → Exception Filter → 응답
```

| 단계 | 역할 | 예시 |
|------|------|------|
| **Middleware** | 요청/응답 변환 | 로깅, CORS, 바디 파싱 |
| **Guard** | 인증/인가 검사 | JWT 검증, 역할 확인 |
| **Interceptor (전)** | 요청 전처리 | 로깅, 캐싱 |
| **Pipe** | 데이터 변환/검증 | DTO 유효성 검사 |
| **Controller** | 라우팅 | 요청 처리 |
| **Service** | 비즈니스 로직 | DB 조회, 계산 |
| **Interceptor (후)** | 응답 후처리 | 응답 변환, 로깅 |
| **Exception Filter** | 예외 처리 | 에러 응답 포맷 |

---

## Middleware

**요청이 컨트롤러에 도달하기 전에 실행**됩니다. Express 미들웨어와 동일한 개념입니다.

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}

// 적용
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

---

## Guard

**요청을 허용할지 거부할지 결정**합니다. 주로 인증/인가에 사용됩니다. `true`를 반환하면 요청 진행, `false`면 거부됩니다.

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }
  
  private validateRequest(request: Request): boolean {
    // JWT 토큰 검증 등
    return !!request.headers.authorization;
  }
}

// 적용
@UseGuards(AuthGuard)
@Controller('users')
export class UserController {}
```

역할 기반 가드는 `Reflector`로 데코레이터 메타데이터(필요한 역할)를 읽어 사용자 역할과 비교합니다.

---

## Pipe

**데이터 변환과 유효성 검사**를 수행합니다. 컨트롤러 메서드 실행 전에 인자를 처리합니다.

### 내장 Pipe

| Pipe | 설명 |
|------|------|
| `ValidationPipe` | DTO 유효성 검사 (class-validator) |
| `ParseIntPipe` | 문자열 → 정수 변환 |
| `ParseUUIDPipe` | UUID 형식 검증 |
| `DefaultValuePipe` | 기본값 설정 |

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.userService.findOne(id);  // id는 이미 number
}
```

### ValidationPipe + class-validator

DTO에 `@IsString()`, `@IsEmail()`, `@Min()` 등의 데코레이터를 붙이고, 전역에 `ValidationPipe`를 설정하면 자동으로 유효성을 검사합니다. `whitelist: true`는 DTO에 없는 속성을 제거하고, `transform: true`는 타입을 자동 변환합니다.

---

## Interceptor

**요청 전후에 로직을 추가**합니다. 로깅, 캐싱, 응답 변환, 타임아웃 등에 사용됩니다. `NestInterceptor`를 구현하고, `intercept()` 메서드에서 `next.handle()`을 호출합니다. RxJS의 `pipe()`로 응답을 변환할 수 있습니다.

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => ({ success: true, data })),  // 응답 래핑
    );
  }
}
```

---

## Exception Filter

**예외를 잡아 적절한 응답으로 변환**합니다. Nest.js는 기본 예외 필터를 제공하지만, 커스터마이징할 수 있습니다.

### 내장 예외

| 예외 | 상태 코드 |
|------|----------|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `InternalServerErrorException` | 500 |

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  const user = this.userService.findOne(id);
  if (!user) {
    throw new NotFoundException(`User ${id} not found`);
  }
  return user;
}
```

### 커스텀 예외 필터

`@Catch()` 데코레이터와 `ExceptionFilter` 인터페이스로 예외 응답을 커스터마이징합니다. 응답 포맷 통일, 로깅 등에 활용합니다.

---

## 데이터베이스 연동

### TypeORM

Nest.js와 가장 잘 통합되는 ORM입니다. `@Entity()` 데코레이터로 엔티티를 정의하고, `TypeOrmModule.forFeature([Entity])`로 모듈에 등록합니다. 서비스에서 `@InjectRepository(Entity)`로 리포지토리를 주입받아 사용합니다.

### Prisma

타입 안전성이 뛰어난 ORM입니다. `schema.prisma` 파일에서 모델을 정의하면 타입이 자동 생성됩니다. PrismaService를 주입받아 `prisma.user.findMany()` 형태로 사용합니다.

---

## 프로젝트 구조

기능별로 모듈 폴더를 나눕니다. 각 모듈 폴더에는 `module.ts`, `controller.ts`, `service.ts`, `dto/`, `entities/`가 포함됩니다. 공통 가드, 인터셉터, 필터는 `common/` 폴더에 둡니다.

---

## 면접 예상 질문

**Q. Nest.js란?**

Node.js 기반 서버 프레임워크로, TypeScript를 기본으로 사용하며 Angular에서 영감을 받은 구조화된 아키텍처를 제공합니다. 모듈, 의존성 주입, 데코레이터 패턴으로 엔터프라이즈급 애플리케이션 개발에 적합합니다.

**Q. Express와 Nest.js의 차이?**

Express는 자유로운 구조로 빠른 개발에 적합하지만, 프로젝트가 커지면 혼란스러워집니다. Nest.js는 강제된 아키텍처로 초기 학습 비용이 있지만, 모듈화, DI, 테스트 용이성 등 대규모 프로젝트에서 유지보수가 쉽습니다.

**Q. Module, Controller, Service의 역할?**

Module은 관련 기능을 그룹화합니다. Controller는 HTTP 요청을 라우팅하고, 비즈니스 로직은 Service에 위임합니다. Service는 실제 비즈니스 로직과 DB 접근을 담당합니다.

**Q. 의존성 주입이란?**

객체가 필요한 의존성을 직접 생성하지 않고 외부에서 주입받는 패턴입니다. 느슨한 결합으로 테스트가 쉽고 구현체 교체가 용이합니다. Nest.js는 IoC 컨테이너로 DI를 자동 처리합니다.

**Q. Guard와 Middleware의 차이?**

Middleware는 요청/응답을 변환하는 범용 도구로 Express 미들웨어와 동일합니다. Guard는 요청 허용/거부를 결정하며 주로 인증/인가에 사용됩니다. Guard는 실행 컨텍스트에 접근하여 데코레이터 메타데이터를 읽을 수 있습니다.

**Q. Pipe의 역할?**

데이터 변환과 유효성 검사를 수행합니다. ValidationPipe와 class-validator로 DTO의 유효성을 자동 검증하고, ParseIntPipe 등으로 타입을 변환합니다. 컨트롤러 메서드 실행 전에 인자를 처리합니다.