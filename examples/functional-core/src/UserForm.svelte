<script lang="ts">
  import { useDispatch, useRootStore } from './root.ts';

  const root = useRootStore();
  const dispatch = useDispatch();
  const user = $derived(root.state.user);

  const handleInput = (email: string) => {
    void dispatch({ type: 'UserSetEmailAction', email });
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    await dispatch({ type: 'UserLoadAction' });
  };
</script>

<form onsubmit={handleSubmit}>
  <label for="email">Email</label>
  <input
    id="email" type="email" required value={user.email}
    disabled={user.status === 'loading'}
    oninput={(event) => handleInput(event.currentTarget.value)}
    aria-describedby="email-hint"
  />
  <p id="email-hint">Use error@example.test to simulate a failed request.</p>
  <button type="submit" disabled={user.status === 'loading'}>Load user</button>
</form>

<p>Email in state: {user.email}</p>
<p role="status">Status: {user.status}</p>
{#if user.data}
  <section aria-label="Loaded user">
    <h2>{user.data.name}</h2>
    <p>Loaded email: {user.data.email}</p>
  </section>
{/if}

<style>
  label { display: block; margin-bottom: 6px; font-weight: 600; }
  input { box-sizing: border-box; width: 100%; padding: 10px; font: inherit; border: 1px solid #9aa5b5; border-radius: 4px; }
  #email-hint { color: #536071; font-size: 14px; }
  section { border-top: 1px solid #d8dee7; margin-top: 20px; }
</style>
