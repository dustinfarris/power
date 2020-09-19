# power

Create Evernote notes for every new Todoist item and link them to each other.

Also create morning standup notes every weekday morning by querying Todoist
completed tasks for yesterday and tasks in the "Curent" section and blockers
with the "@Waiting" tag.

## Deploying

This is a [Pulumi](https://www.pulumi.com) project.

Anyone using this will need to create a new Pulumi stack.  My "prod" stack is
committed to version control here, but you'd want to remove that and create
your own with the same config items:

  * aws:accessKey
  * aws:region
  * aws:secretKey
  * evernoteShard (probably "s1")
  * evernoteToken (get this at dev.evernote.com)
  * todoistToken (get this at developer.todoist.com)

Then you can deploy to AWS in the usual way:

    pulumi up

Enjoy!
