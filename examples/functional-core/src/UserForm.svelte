<script lang="ts">
  import { rootStore } from './store/root';
  import { userPresenter } from './features/user/ui/user.presenter';

  const root = rootStore();
  const user = $derived(root.state.user);
  const viewState = $derived(userPresenter(user));

  const handleInput = (email: string) => {
    void root.dispatch({ scope: 'users', type: 'SetEmailAction', email });
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    await root.dispatch({ scope: 'users', type: 'LoadAction' });
  };
</script>

<form onsubmit={handleSubmit}>
  <label for="email">Email</label>
  <input
    id="email" type="email" required value={viewState.email}
    disabled={viewState.isLoading}
    oninput={(event) => handleInput(event.currentTarget.value)}
    aria-describedby="email-hint"
  />
  <p id="email-hint">Use error@example.test to simulate a failed request.</p>
  <button type="submit" disabled={viewState.isLoading}>Load user</button>
</form>

<p>Email in state: {viewState.email}</p>
<p role="status">Status: {viewState.status}</p>
{#if viewState.loadedUser}
  <section aria-label="Loaded user">
    <h2>{viewState.loadedUser.name}</h2>
    <p>Loaded email: {viewState.loadedUser.email}</p>
  </section>
{/if}

<style>
  label { display: block; margin-bottom: 6px; font-weight: 600; }
  input { box-sizing: border-box; width: 100%; padding: 10px; font: inherit; border: 1px solid #9aa5b5; border-radius: 4px; }
  #email-hint { color: #536071; font-size: 14px; }
  section { border-top: 1px solid #d8dee7; margin-top: 20px; }
</style>
