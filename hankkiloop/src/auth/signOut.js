export async function signOutAccount(client, userId, cleanup) {
  // Only the remote DB deletion may fail. The local binding/subscription must be
  // stopped first, so a signed-out account cannot keep receiving its old pushes.
  await cleanup(client, userId, { allowRemoteFailure: true })
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw error
}
