async function findAuthUserByEmail(email) {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });


  if (listError) {
    throw new Error(`既存ユーザーの確認に失敗しました: ${listError.message}`);
  }

  const existing = users.users.find((user) => user.email === email);
  return existing?.id ?? null;
}

async function ensureAuthUser(employee) {
  const existingUserId = await findAuthUserByEmail(employee.email);
  if (existingUserId) {
    return existingUserId;
  }

  const createPayload = {
    email: employee.email,
    email_confirm: true,
    user_metadata: {
      role: "employee",
    },
  };

  if (DEFAULT_PASSWORD) {
    createPayload.password = DEFAULT_PASSWORD;
  }

  const { data, error } = await supabase.auth.admin.createUser(createPayload);

  if (error) {
    throw new Error(`${employee.email} のAuthユーザー作成に失敗しました: ${error.message}`);
  }

  return data.user.id;
}

async function ensureProfileTables(employeeId) {
  const { error: profileError } = await supabase
    .from("employee_profiles")
    .upsert(
      {
        employee_id: employeeId,
        career_summary: null,
        strengths: null,
        current_issues: null,
        notes_hr: null,
      },
      { onConflict: "employee_id" }
    );

  if (profileError && !profileError.message.includes('relation "employee_profiles" does not exist')) {
    throw new Error(`employee_profiles の投入に失敗しました: ${profileError.message}`);
  }

  const { error: goalError } = await supabase
    .from("employee_career_goals")
    .upsert(
      {
        employee_id: employeeId,
        goal_1y: null,
        goal_3y: null,
        desired_role: null,
        desired_career_path: null,
        reskilling_interest: null,
        mobility_preference: null,
        self_comment: null,
      },
      { onConflict: "employee_id" }
    );

  if (goalError && !goalError.message.includes('relation "employee_career_goals" does not exist')) {
    throw new Error(`employee_career_goals の投入に失敗しました: ${goalError.message}`);
  }
}

async function main() {
  const [branches, departments, positions, grades] = await Promise.all([
    fetchMaster("branches", "id, name"),
    fetchMaster("departments", "id, name, branch_id"),
    fetchMaster("positions", "id, name", "sort_order"),
    fetchMaster("grades", "id, name", "sort_order"),
  ]);

  const employeesToUpsert = [];

  for (let index = 0; index < demoEmployees.length; index += 1) {
    const employee = demoEmployees[index];
    const branch = pickRoundRobin(branches, index);
    const departmentCandidates = departments.filter(
      (item) => item.branch_id === branch.id
    );
    const department = departmentCandidates.length
      ? pickRoundRobin(departmentCandidates, index)
      : pickRoundRobin(departments, index);
    const position = pickRoundRobin(positions, index);
    const grade = pickRoundRobin(grades, index);
    const userId = await ensureAuthUser(employee);

    employeesToUpsert.push({
      user_id: userId,
      employee_code: employee.code,
      name: employee.name,
      email: employee.email,
      branch_id: branch.id,
      department_id: department.id,
      position_id: position.id,
      grade_id: grade.id,
      employment_type: employee.employmentType,
      hire_date: employee.hireDate,
      status: employee.status,
    });
  }

  const { data: upsertedEmployees, error: employeeError } = await supabase
    .from("employees")
    .upsert(employeesToUpsert, { onConflict: "employee_code" })
    .select("id, user_id, employee_code, name");

  if (employeeError) {
    throw new Error(`employees の投入に失敗しました: ${employeeError.message}`);
  }

  for (const employee of upsertedEmployees ?? []) {
    await ensureProfileTables(employee.id);

    if (!employee.user_id) {
      throw new Error(`employees.user_id が未設定のため metadata を更新できませんでした: ${employee.employee_code}`);
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(employee.user_id, {
      user_metadata: {
        role: "employee",
        employeeId: employee.id,
      },
    });

    if (authUpdateError) {
      throw new Error(`Authユーザーのmetadata更新に失敗しました: ${authUpdateError.message}`);
    }
  }

  console.log(`Inserted or updated ${upsertedEmployees?.length ?? 0} demo employees.`);
  for (const employee of upsertedEmployees ?? []) {
    console.log(`- ${employee.employee_code}: ${employee.name}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});