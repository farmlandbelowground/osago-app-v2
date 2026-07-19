import Link from 'next/link'
import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { TODO_PROGRESS_PERCENTAGE_MULTIPLIER } from '../../constants'
import { type DashboardTodo } from '../../types'
import { type Props } from './types'

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="13"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ArrowIcon: FC = () => (
  <svg
    className="todo-arrow"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const ChevronIcon: FC = () => (
  <svg
    className="todo-done-chevron"
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transition: 'transform .2s' }}
    viewBox="0 0 24 24"
    width="14"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const renderTodo = (todo: DashboardTodo) => (
  <Link
    className={cn('todo-item', todo.done && 'done')}
    href={todo.href}
    key={todo.label}
  >
    <div className="todo-checkbox">
      <CheckIcon />
    </div>
    <div className="todo-text">{todo.label}</div>
    <ArrowIcon />
  </Link>
)

export const DashboardTodoList: FC<Props> = ({ todos }) => {
  const doneTodos = todos.filter(todo => todo.done)
  const openTodos = todos.filter(todo => !todo.done)
  const progressPercent =
    todos.length === 0
      ? 0
      : Math.round(
          (doneTodos.length / todos.length) *
            TODO_PROGRESS_PERCENTAGE_MULTIPLIER,
        )

  return (
    <div className="card mb-5">
      <div
        className="flex-between"
        style={{
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '6px',
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>To-do lijst</h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            De volgende stappen helpen je om jouw verkooptraject te starten.
          </p>
        </div>
        <span
          className="text-sm"
          style={{ color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {doneTodos.length} / {todos.length} voltooid
        </span>
      </div>
      <div
        style={{
          background: 'var(--line-soft)',
          borderRadius: '99px',
          height: '8px',
          margin: '14px 0 18px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--green)',
            height: '100%',
            transition: 'width .3s',
            width: `${progressPercent}%`,
          }}
        />
      </div>
      <div className="todo-list">{openTodos.map(renderTodo)}</div>
      {doneTodos.length > 0 && (
        <details
          className="todo-done-details"
          style={{ marginTop: openTodos.length > 0 ? '14px' : '0' }}
        >
          <summary
            style={{
              alignItems: 'center',
              background: 'var(--line-soft)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              display: 'inline-flex',
              fontSize: '13px',
              fontWeight: 500,
              gap: '8px',
              listStyle: 'none',
              padding: '8px 12px',
              userSelect: 'none',
            }}
          >
            <ChevronIcon />
            Voltooide taken ({doneTodos.length})
          </summary>
          <div className="todo-list" style={{ marginTop: '12px' }}>
            {doneTodos.map(renderTodo)}
          </div>
        </details>
      )}
    </div>
  )
}
