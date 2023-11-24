INCLUDE ./storylets.ink

-> hub

== hub
#CLEAR
The hub.

+ [All open storylets]
    <- storylets_thread("", -> hub)
    ++ [Back]
+ [3 storylets]
    <- storylets_thread("max=3", -> hub)
    ++ [Back]
+ [3 random storylets]
    -- (random_3)
    <- storylets_thread("max=3&random", -> hub)
    ++ [Again] -> random_3
    ++ [Back]
+ [All random storylets]
    -- (random_all)
    <- storylets_thread("random", -> hub)
    ++ [Again] -> random_all
    ++ [Back]
+ [3 storylets of the non-existing "cat" category]
    Since the category doesn't exist, this will return 0 storylet.
    <- storylets_thread("max=3&category=cat", -> hub)
    ++ [We didn't find anything, let's go back to the hub.]
+ [3 storylets of the "dog" category]
    -> storylets_tunnel("max=3&category=dog") ->
+ (exclusivity_demo) [3 storylets of the "exclusive" category]
    The "exclusive" storylets have an exclusivity value so only the highest value is selected. They are open only in this section of the demo, otherwise they would always be selected.
    -> storylets_tunnel("max=3&category=exclusive") ->
+ [3 storylets with a custom filter]
    We use a custom filter "3 ≤ magic ≤ 8", defined as an ink function.
    We will only get 2 storylets matching the filter.
    <- storylets_thread("max=3&filter=filter_magic_3_to_8", -> hub)
    ++ [Back]
+ [1 multicategory storylet with "foo" category]
    Let's display the "foo" storylets, then the "bar" storylets. We should have the same one twice.
    <- storylets_thread("max=1&category=foo", -> hub)
    <- storylets_thread("max=1&category=bar", -> hub)
    ++ [Back]
+ (event_demo) [Random event]
    This section runs one random storylet which has content before the choices.
    <- storylets_thread("category=event&max=1&random", -> hub) 
    ++ {STORYLET_COUNT == 0} [No more events - Continue]
    ++ {CHOICE_COUNT() == 0} [Continue] // Pause if there were no choices
-
-> hub


== function filter_magic_3_to_8(storylet_name)
~ temp magic = storylets_get_prop(storylet_name, "magic", 0)
DEBUG: {storylet_name} {magic}
~ return 3 <= magic && magic <= 8


== the_closed_one
#storylet
= open
{false}
= content
+ [You'll never see me]
-
->->

== multicat
#storylet: foo, bar
= content
+ [Multi categories storylet]
-
->->

== magic_2
#storylet
= magic
{2}
= content
+ [Shazam (magic=2)]
-
->->

== magic_5
#storylet
= magic
{2+3}
= content
+ [Abracadabra (magic=5)]
-
->->

== magic_7
#storylet
= magic
{7}
= content
+ [Hocus pocus (magic=7)]
-
->->

== dog_1
#storylet: dog
= content
+ [Golden Retriever]
-
->->

== dog_2
#storylet: dog
= urgency
{4}
= content
+ [German Shepherd (urgency=4)]
-
->->

== dog_3
#storylet: dog
= content
+ [Poodle]
-
->->

== dog_4
#storylet: dog
= content
+ [Dachshund]
-
->->


== exclusive_0
#storylet: exclusive
= open
{came_from(-> hub.exclusivity_demo)}
= exclusivity
{0}
= content
+ [This one is never selected (exclusivity=0)]
->->

== exclusive_1
#storylet: exclusive
= open
{came_from(-> hub.exclusivity_demo)}
= urgency
{5}
= exclusivity
{1}
= content
+ (enable_level_2) [Visit me to open a level 2 storylet (urgency=5, exclusivity=1)]
->->


== exclusive_2
#storylet: exclusive
VAR exclu = 1 // global!
= open
{came_from(-> hub.exclusivity_demo)}
= urgency
{2}
= exclusivity
{exclu}
= content
+ [Another storylet  (urgency=2, exclusivity={exclu}))]
-
->->

== exclusive_3
#storylet: exclusive
= open
{came_from(-> hub.exclusivity_demo) && exclusive_1.enable_level_2}
= urgency
{2}
= exclusivity
{2}
= content
+ [This is a level 2 exclusive story (urgency=2, exclusive=2)]
-
->->


== exclusive_4
#storylet: exclusive
= open
{came_from(-> hub.exclusivity_demo)}
= urgency
{7}
= exclusivity
{1}
= content
+ [Urgent storylet (urgency=7, exclusive=1)]
-
->->

== event_1
#storylet: event
= open
{came_from(-> hub.event_demo) and not content}
= content
You found a piece of solar panel. If it's fixable, it could help with the power fluctuations. 
Or it could fetch a decent price at the station.
+ [Store it in the workshop]
+ [Put it in the "for sale" crate]
- 
->->

== event_2
#storylet: event
= open
{came_from(-> hub.event_demo) and not content}
= content
You found a plastic fragment. Probably from the broken visor of a helmet. Poor soul.
You put the fragment in the recycling bin.
->->

=== function came_from(-> x)
~ return TURNS_SINCE(x) == 0
