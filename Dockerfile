FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    vim \
    less \
    tree \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create users
RUN useradd -m -s /bin/bash student
RUN useradd -m -s /bin/bash goblin
RUN useradd -m -s /bin/bash wizard

RUN groupadd heroes
RUN groupadd monsters

RUN usermod -aG monsters goblin
RUN usermod -aG heroes wizard

RUN echo "Welcome! Try: ls, pwd, cd, mkdir, cat, echo, vim" > /home/student/README.txt 

# Set up maze
RUN mkdir -p /home/student/MAZE/entrance && \
    mkdir -p /home/student/MAZE/entrance/left/up && \
    mkdir -p /home/student/MAZE/entrance/left/down && \
    mkdir -p /home/student/MAZE/entrance/right/rope_swing && \
    mkdir -p /home/student/MAZE/entrance/right/narrow_cliff
 
RUN echo "At the entrance of the maze there are two path ways, one heading left and one heading right. You hear a low rumbling coming from the right." > /home/student/MAZE/entrance/sign.txt && \
    chown goblin:monsters /home/student/MAZE/entrance/sign.txt
 
RUN echo "You enter a small room with a ladder in the center. The ladder goes down through the floor or up through the ceiling. A faint light shines through from above." > /home/student/MAZE/entrance/left/sign.txt && \
    chown wizard:heroes /home/student/MAZE/entrance/left/sign.txt
 
RUN echo "You climb up the ladder, the further up you climb the brighter the light gets. Eventually you reach the surface, there doesn't seem to be anything interesting here." > /home/student/MAZE/entrance/left/up/sign.txt && \
    chown wizard:heroes /home/student/MAZE/entrance/left/up/sign.txt
 
RUN echo "As you descend the ladder the air becomes damp. At the bottom you find a winding cave with an underground river running through it." > /home/student/MAZE/entrance/left/down/sign.txt && \
    chown wizard:heroes /home/student/MAZE/entrance/left/down/sign.txt
 
RUN echo "You enter a large room with a deep chasm in the middle and a door on the other side. A loud rumbling sound is coming from the chasm. There is a long rope hanging above the chasm that could be used to swing across or a narrow cliff that you could shimmy across." > /home/student/MAZE/entrance/right/sign.txt && \
    chown wizard:heroes /home/student/MAZE/entrance/right/sign.txt
 
RUN echo "You grab the rope to swing across the chasm. As you swing the rope snaps and you plummet into the chasm. You land in a large pool of water being fed by a roaring underground river." > /home/student/MAZE/entrance/right/rope_swing/sign.txt && \
    chown wizard:heroes /home/student/MAZE/entrance/right/rope_swing/sign.txt
 
RUN echo "You carefully shimmy across the narrow cliff to the other side of the chasm. You open the door on the other side to find it is completely blocked by rubble." > /home/student/MAZE/entrance/right/narrow_cliff/sign.txt && \
    chown wizard:heroes /home/student/MAZE/entrance/right/narrow_cliff/sign.txt


COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

USER student
WORKDIR /home/student

CMD ["/startup.sh"]