FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    vim \
    less \
    tree \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root student user
RUN useradd -m -s /bin/bash student

# Friendly prompt and a welcome file
RUN echo 'PS1="\[\033[01;32m\]student@terminal\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> /home/student/.bashrc && \
    echo "Welcome! Try: ls, pwd, cd, mkdir, cat, echo, vim" > /home/student/README.txt && \
    chown -R student:student /home/student

USER student
WORKDIR /home/student

CMD ["/bin/bash"]