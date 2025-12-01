class EchoUser {
  final String userId;
  final String? name;
  final String? email;

  EchoUser({
    required this.userId,
    this.name,
    this.email,
  });

  factory EchoUser.fromJson(Map<String, dynamic> json) {
    return EchoUser(
      userId: (json['userId'] ?? json['_id'] ?? '').toString(),
      name: json['name'] as String?,
      email: json['email'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'name': name,
        'email': email,
      };
}
