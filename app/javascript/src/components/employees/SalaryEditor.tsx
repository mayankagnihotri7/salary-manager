import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "../../api/client";
import { updateEmployeeSalary } from "../../api/employee";
import { useSession } from "../../hooks/useSession";
import { formatSalary } from "../../lib/format";
import type { Employee } from "../../types/employee";

// Validation messages from a 422 for the salary field only; anything else is unexpected.
const salaryErrors = (data: unknown): string[] | null => {
  if (typeof data !== "object" || data === null || !("errors" in data)) {
    return null;
  }
  const { errors } = data;
  if (typeof errors !== "object" || errors === null || !("salary" in errors)) {
    return null;
  }
  const { salary } = errors;
  return Array.isArray(salary) &&
    salary.length > 0 &&
    salary.every((message) => typeof message === "string")
    ? salary
    : null;
};

type Props = {
  employee: Employee;
  canEdit: boolean;
  onUpdated: (employee: Employee) => void;
};

export const SalaryEditor = ({ employee, canEdit, onUpdated }: Props) => {
  const { expire } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setValue(employee.salary);
    setFieldError(null);
    setIsEditing(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const salary = value.trim();
    if (salary === "") {
      setFieldError("Enter a salary.");
      return;
    }

    setIsSaving(true);
    setFieldError(null);

    try {
      const updated = await updateEmployeeSalary(employee.id, salary);
      onUpdated(updated);
      setIsEditing(false);
      toast.success("Salary updated");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        expire();
        return;
      }
      const messages =
        caught instanceof ApiError && caught.status === 422
          ? salaryErrors(caught.data)
          : null;
      if (messages) {
        setFieldError(`Salary ${messages.join(", ")}.`);
      } else {
        toast.error("The salary could not be updated. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      aria-labelledby='salary-heading'
      className='rounded-lg border border-slate-200 bg-white p-4'
    >
      <h3
        id='salary-heading'
        className='text-sm font-medium text-slate-600'
      >
        Salary
      </h3>

      {isEditing ? (
        <form onSubmit={handleSubmit} noValidate className='mt-2 space-y-2'>
          <label htmlFor='salary' className='block text-sm text-slate-700'>
            Salary ({employee.currency})
          </label>
          <input
            id='salary'
            type='text'
            inputMode='decimal'
            autoComplete='off'
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={isSaving}
            aria-invalid={fieldError !== null}
            aria-describedby={fieldError ? "salary-error" : undefined}
            className='w-full max-w-xs rounded border border-slate-300 px-3 py-1.5 tabular-nums aria-invalid:border-red-500'
          />
          {fieldError && (
            <p id='salary-error' className='text-sm text-red-700'>
              {fieldError}
            </p>
          )}
          <div className='flex gap-2'>
            <button
              type='submit'
              disabled={isSaving}
              className='rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-60'
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              type='button'
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className='rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60'
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className='mt-1 flex items-center gap-4'>
          <p className='text-2xl font-semibold tabular-nums text-slate-900'>
            {formatSalary(employee.salary, employee.currency)}
          </p>
          {canEdit && (
            <button
              type='button'
              onClick={startEditing}
              className='rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100'
            >
              Edit salary
            </button>
          )}
        </div>
      )}
    </section>
  );
};
