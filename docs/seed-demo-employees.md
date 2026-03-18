# ダミー社員データの投入

`/employees` の表示確認用に、Supabaseへダミー社員6件を投入するためのスクリプトを追加しました。

## 前提

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

必要に応じて以下も指定できます。

- `DEMO_EMPLOYEE_PREFIX`（デフォルト: `DEMO`）
- `DEMO_EMPLOYEE_PASSWORD`（指定時のみ Auth ユーザーの初期パスワードを設定）

## 実行方法

```bash
npm run seed:demo-employees
```

## スクリプトの動作

- `branches` / `departments` / `positions` / `grades` の既存マスタを使ってダミー社員を割り当てます。
- `employee_code` をキーに `upsert` するため、同じプレフィックスで再実行しても更新扱いになります。
- 対応する Supabase Auth ユーザーも作成し、`user_metadata.role=employee` と `user_metadata.employeeId` を設定します。
- `employee_profiles` と `employee_career_goals` が存在する場合は初期レコードも `upsert` します。

## 注意

- このスクリプトは `employees.user_id` を更新できる権限を前提としています。
- マスタテーブルが空の場合はエラーで停止します。先に支店・部署・役職・等級マスタを登録してください。