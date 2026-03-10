# Forward and Archive Actions

`Forward and Archive Actions` is a Thunderbird MailExtension that adds a single
message-header action button. When one action is configured, clicking the button
executes it immediately. When multiple actions are configured, the button opens
a chooser popup.

## Features

- Add any number of configured actions through the extension options page.
- Set a custom label and destination email address for each action.
- Optionally require a PDF attachment before forwarding.
- Archive the current message after a successful forward.
- Archive without forwarding when the action requires a PDF and the message does
  not contain one.

## Installation

1. Build the extension package from the project root:

   ```bash
   npm run build
   ```

2. Open Thunderbird.
3. Go to `Tools -> Add-ons and Themes`.
4. Choose `Install Add-on From File...`.
5. Select the generated `.xpi` file from `dist/`.

## Configuration

1. Open the extension preferences from Thunderbird's add-on manager.
2. Click `Add action`.
3. Enter a label and a destination email address.
4. Optionally enable `Only forward when a PDF attachment is present`.
5. Save the configuration.

The message header will then show a `Forward+Archive` action button. With one
configured action it runs directly, and with multiple actions it opens a popup
listing the available actions.

## Runtime Behavior

- If the action does not require a PDF attachment, the displayed message is
  forwarded to the configured destination and then archived.
- If the action requires a PDF attachment and one is present, the same
  forward-then-archive flow is used.
- If the action requires a PDF attachment and none is present, the message is
  archived without forwarding.
- If Thunderbird fails to send the forwarded message, the original message is
  left in place and is not archived.

## Known Limitations

- Thunderbird's supported MailExtension API currently allows one
  `message_display_action` button per extension, so this project uses a single
  configurable action button instead of multiple sibling header buttons.
- Thunderbird's supported MailExtension API does not currently expose a way to
  hide the built-in Archive button. This extension documents that limitation and
  does not attempt unsupported workarounds.
