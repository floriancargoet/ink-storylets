EXTERNAL storylets_select(query)
EXTERNAL storylets_get_next()
EXTERNAL storylets_get_prop(storylet_name, prop_name, default_value)

VAR STORYLET_COUNT = 0

// fallbacks for inky
== function storylets_select(query)
~ return

== function storylets_get_next()
~ return -> storylets_internal.null_stitch

== function storylets_get_prop(storylet_name, prop_name, default_value)
~ return default_value

== storylets_tunnel(query)
-> storylets_internal.tunnel(query) ->
->->

== storylets_thread(query, -> return_to)
<- storylets_internal.thread(query, return_to)

== storylets_internal
= tunnel(query)
<- thread(query, -> exit_tunnel)
+ -> // empty choice to stop threading
// finished storylet will return here.
- (exit_tunnel)
    ->->

= thread(query, -> return_to)
~ STORYLET_COUNT = 0
~ storylets_select(query)
<- thread_recurse(return_to)

// exhaust the storylets in the iterator.
// iteration is done through recursion.
= thread_recurse(-> return_to)
// divert to -> return_to when done
~ temp storylet_text_stitch = storylets_get_next()
// iterator will return a null divert target (a divert to null_stitch) when empty.
{  storylet_text_stitch != -> null_stitch:
    ~ STORYLET_COUNT++
    <- thread_in_tunnel(storylet_text_stitch, return_to)
    <- thread_recurse(return_to) // recurse
}

// function from inky's snippets
= thread_in_tunnel(-> tunnel_to_run, -> return_to)
~ temp entry_turn_choice = TURNS()
-> tunnel_to_run ->
{entry_turn_choice != TURNS():
    -> return_to
}
-> DONE

= null_stitch
// this knot is used as a "null divert" since we can't check if a var really contains a divert.
// external functions will return `-> null_stitch` when they need to return null.
// here, it's used when the iterator doesn't have storylets anymore.
-> DONE
