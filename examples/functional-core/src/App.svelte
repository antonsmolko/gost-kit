<script lang="ts">
  import UserForm from './UserForm.svelte';
  import GlobalAlert from './GlobalAlert.svelte';
</script>

<main>
  <h1>Functional core example</h1>
  <p>Change an email, load a user and observe the root state.</p>
  <GlobalAlert />
  <UserForm />
</main>

<style>
  :global(body) { margin: 0; background: #f5f6f8; color: #18212e; font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 640px; margin: 48px auto; padding: 28px; background: white; border-radius: 12px; }
  h1 { margin-top: 0; }
  :global(button) { cursor: pointer; padding: 8px 14px; font: inherit; }
  :global(button:disabled) { cursor: default; }
</style>
