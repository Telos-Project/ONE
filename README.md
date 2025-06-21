# ONE

## 1 - Abstract

ONE is an extremely minimalistic data interchange language that allows the user to define a tree of
string literals.

String literals may only be encoded in elements, and elements may be nested within one another.

An element is started with a minus sign followed by a new line and a tab. Every character from the
first tab (exclusive) to the new line character (inclusive if and only if not the last line in the
element) is encoded into the string. Every new line character must be followed either with a tab
which continues the element, or by a minus sign which ends the element. There must be at least one
line between the starting and ending lines.

If an element is nested within another element, every line of the element must be preceded by one
tab for every level it is nested. No whitespace is permitted between elements.

A ONE file is referred to as a "document", and the proper file extension for a ONE file is ".one".

Among the many other strengths of ONE, it is as easily read by humans as by machines, making it
just as good for plain text literature as it is for data and code.

## 2 - Contents

### 2.1 - Example ONE Documents

#### 2.1.1 - Document with one element with no content

    -
    	
    -

#### 2.1.2 - Document with one element with content

    -
    	Element
    -

#### 2.1.3 - Document with one element that has multiple lines

    -
    	Line 1
    		Line 2
    			Line 3
    -

Note: The above element encodes the following string: "Line 1\n\tLine 2\n\t\tLine3".

#### 2.1.4 - Document with two elements

    -
    	Element 1
    -
    -
    	Element 2
    -

#### 2.1.5 - Document with multiple elements, some of which have children

    -
    	Element 1
    -
    	-
    		Child 1
    	-
    	-
    		Child 2
    	-
    -
    	Element 2
    -
    -
    	Element 3
    -
    	-
    		Child 1
    	-
    		-
    			Grand Child 1
    		-

---

# ONE+

## 1 - Abstract

While ONE is versatile, it is quite cumbersome to write it by hand. ONE+ was created to compensate
for this.

ONE+ provides users with more options for encoding and nesting elements. While there is only one
way to express any given document in ONE, a single ONE document can be expressed in many different
ways in ONE+. No matter how a ONE+ document is written, it will convert to ONE before being
processed.

Because ONE+ is not only an abstraction of ONE but also a superset, any text that is valid in ONE
is valid in ONE+.

However, unlike ONE, ONE+ does make use of token characters and thus requires escape sequences in
certain situations.

The proper file extension for a ONE+ file is ".op".

## 2 - Contents

### 2.1 - Indentation

While ONE only allows the use of tabs for indentation,
ONE+ allows either tabs or an arbitrary number of spaces.
However, the use of indentation must be consistent throughout the file.

### 2.2 - Element Definitions

ONE+ allows elements to be defined outside of element blocks.
A non-blank line containing no token characters written will be converted into an element block.
Any leading or trailing whitespace will be removed.

For example:

    abc
    	xyz

    123

will be converted to:

    -
    	abc
    -
    	-
    		xyz
    	-
    -
    	123
    -

### 2.3 - Multiple Element Definitions

It is also possible to encode multiple elements into a single line.
Such a line is called a "multiple element definition".
Various token characters may be used to separate the elements.
The token character used determines how the nest level is affected.

When nesting a child element beneath a multiple element line,
the element that will become the parent is the most recent element at the nest level of the end of the line.

The token characters used in multiple element definitions are as follows:

, - Does not affect nest level<br/>
: - Increments nest level  
; - Decrements nest level  
( - Stores but does not affect nest level  
) - Restores nest level to that stored by corresponding '('  
{ - Stores and increments nest level  
} - Restores nest level to that stored by corresponding '{'  

#### 2.3.1 - Example 1

    a, b, c

Becomes:

    -
    	a
    -
    -
    	b
    -
    -
    	c
    -

#### 2.3.2 - Example 2

    a: b, c

Becomes:

    -
    	a
    -
    	-
    		b
    	-
    	-
    		c
    	-

#### 2.3.3 - Example 3

    a: b; c

Becomes:

    -
    	a
    -
    	-
    		b
    	-
    -
    	c
    -

#### 2.3.4 - Example 4

    a ( b: c ) d

Becomes:

    -
    	a
    -
    -
    	b
    -
    	-
    		c
    	-
    -
    	d
    -

#### 2.3.5 - Example 5

    a { b: c } d

Becomes:

    -
    	a
    -
    	-
    		b
    	-
    		-
    			c
    		-
    -
    	d
    -

#### 2.3.6 - Example 6

    a: b
    	c

Becomes:

    -
    	a
    -
    	-
    		b
    	-
    		-
    			c
    		-

#### 2.3.7 - Example 7

    a { b: c }
    	d

Becomes:

    -
    	a
    -
    	-
    		b
    	-
    		-
    			c
    		-
    	-
    		d
    	-

### 2.4 - Escape Sequences

The effect of any token character can be negated by preceding it with a tilde.
Likewise,
the negating effect of a tilde can itself be negated with a preceding tilde.
The negating tilde will not be encoded into the element.

If the letter n is preceded by a tilde,
it will be encoded as a new line.
If the letter t is preceded by a tilde,
it will be encoded as a tab.

If a string is placed between two single quotes,
the effects of all token characters between them will be negated.
The single quotes will not be encoded into the string.

Double quotes have the same negating effect as single quotes,
but double quotes will be encoded into the string.

In addition,
no token character will take effect if placed inside an element block.

#### 2.4.1 - Example 1

    a~: b

Becomes:

    -
    	a: b
    -

#### 2.4.2 - Example 2

    a~~: b

Becomes:

    -
    	a~
    -
    	-
    		b
    	-

#### 2.4.3 - Example 3

    'a: b'

Becomes:

    -
    	a: b
    -

#### 2.4.4 - Example 4

    "a: b"

Becomes:

    -
    	"a: b"
    -

#### 2.4.5 - Example 5

    hello~n~tworld

Becomes:

    -
    	hello
    		world
    -

#### 2.4.6 - Example 6

    -
    	a: hello~n~tworld
    -

Becomes:

    -
    	a: hello~n~tworld
    -

### 2.5 - Comments

Any part of a line preceded by a pound sign will be commented out.
A pound sign followed by an open square bracket dictates the start of a comment block.
A comment block is closed with a closed square bracket followed by a pound sign.

#### 2.5.1 - Example 1

    hello # world

Becomes:

    -
    	hello
    -

#### 2.5.1 - Example 2

    hello #[
    abc
    123
    xyz ]#
    world

Becomes:

    -
    	hello
    -
    -
    	world
    -