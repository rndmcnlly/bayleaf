# Ideas

## System prompt prefix injection

When publishing or refreshing a course model, prepend a standard preamble to the system prompt before sending it to OWUI. Something like:

> You are a BayLeaf Courses model. Your system prompt is managed by course staff via the BayLeaf AI page at {canvas_page_url}. Respond helpfully within the scope defined below.

This gives the model grounding context (it knows what it is and where its instructions come from) and gives users a breadcrumb back to the source if the model says something unexpected. The prefix should be injected transparently — staff only edit the Canvas page content; they never see or manage the preamble.
