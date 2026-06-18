# Stripe — прогон тестовых платежей

Вся интеграция читает ключи из окружения, поэтому **test mode** включается просто
тестовыми ключами (`sk_test_...` / `pk_test_...`). Реальных списаний нет.

## 1. Настройка

Скопируй `.env.example` → `.env.local` и заполни:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # выдаёт `stripe listen` (см. ниже)
STRIPE_PRICE_PRO=price_...           # создать в Dashboard → Products (recurring)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Применить изменения схемы БД:

```
npx prisma migrate dev --name stripe_payments
```

## 2. Локальные webhook'и (Stripe CLI)

```
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

CLI напечатает `whsec_...` — положи его в `STRIPE_WEBHOOK_SECRET` и перезапусти `next dev`.

## 3. Тестовые карты

| Номер                 | Поведение                     |
|-----------------------|-------------------------------|
| `4242 4242 4242 4242` | успешная оплата               |
| `4000 0000 0000 9995` | отказ (insufficient funds)    |
| `4000 0025 0000 3155` | требует 3D Secure             |

Срок — любой будущий, CVC — любой, ZIP — любой.

## 4. Сценарий «оплата заказа» (склад)

1. Создай заказ (через AI-агента или `createOrder`). Заказ появится в статусе
   `AWAITING_PAYMENT`, склад **не списан**.
2. Открой в браузере: `http://localhost:3000/api/orders/<ORDER_ID>/checkout`
   — редирект на Stripe Checkout. Оплати картой `4242...`.
3. Прилетит webhook `checkout.session.completed` → `finalizePaidOrder`:
   - статус заказа → `PROCESSING`, проставлен `paidAt`;
   - запостились `OUT`-движения в `StockMovement`, `Product.cachedQuantity`
     уменьшился.

Проверка движений: открой страницу `/movements` или глянь таблицу `StockMovement`.

## 5. Сценарий «подписка» (Tenant)

1. Страница `/company` → кнопка **Upgrade Plan** → Stripe Checkout (`subscription`).
2. Оплати картой `4242...`.
3. Webhook `customer.subscription.created/updated` → `Tenant.plan = PRO`,
   проставлены `stripeSubscriptionId`, `subscriptionStatus`, `currentPeriodEnd`.

Управление/отмена подписки — через Stripe Billing Portal (`openBillingPortal`).

## 6. Триггер событий без UI

```
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

> Примечание: webhook идемпотентен — каждый `event.id` обрабатывается один раз
> (таблица `ProcessedStripeEvent`), так что повторные доставки Stripe безопасны.
